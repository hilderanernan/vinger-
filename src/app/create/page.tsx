'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mic, Square, Play, RotateCcw, Send } from 'lucide-react'

export default function CreatePostPage() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }

      mediaRecorderRef.current.start()
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 60) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('Izin mikrofon ditolak atau tidak didukung.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
  }

  const handlePublish = async () => {
    if (!audioBlob) return
    if (duration < 5) {
      setError('Durasi minimal voice post adalah 5 detik.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Silakan login terlebih dahulu.')

      const fileName = `${user.id}/${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-posts')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('voice-posts')
        .getPublicUrl(uploadData.path)

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          audio_url: publicUrl,
          duration,
          caption,
        })

      if (dbError) throw dbError

      router.push('/')
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal mempublikasikan post.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-center">Rekam Voice Post</h1>
        
        <div className="flex flex-col items-center justify-center p-8 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-4">
          <div className="text-4xl font-mono font-bold">
            00:{duration < 10 ? `0${duration}` : duration}
          </div>
          <p className="text-xs text-neutral-400">Maksimal 60 detik (Min 5s)</p>

          {!audioUrl ? (
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-6 rounded-full transition ${
                recording ? 'bg-red-500 animate-pulse' : 'bg-white text-black'
              }`}
            >
              {recording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={resetRecording}
                className="p-3 bg-neutral-800 rounded-full hover:bg-neutral-700"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <audio src={audioUrl} controls className="hidden" id="preview-player" />
              <button
                onClick={() => {
                  const el = document.getElementById('preview-player') as HTMLAudioElement
                  if (el) el.play()
                }}
                className="p-4 bg-white text-black rounded-full"
              >
                <Play className="w-6 h-6 fill-current" />
              </button>
            </div>
          )}
        </div>

        {audioUrl && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Tambahkan caption / #topic..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
            <button
              onClick={handlePublish}
              disabled={uploading}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{uploading ? 'Publishing...' : 'Publish Post'}</span>
            </button>
          </div>
        )}

        {error && <p className="text-sm text-center text-red-500">{error}</p>}
      </div>
    </main>
  )
}
