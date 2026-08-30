'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, Square, Play, RotateCcw, Send, X } from 'lucide-react'

interface CommentModalProps {
  postId: string
  currentUserId: string
  onClose: () => void
  onCommentAdded: () => void
}

export default function AudioCommentModal({ postId, currentUserId, onClose, onCommentAdded }: CommentModalProps) {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
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
          if (prev >= 30) {
            stopRecording()
            return 30
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('Akses mic ditolak.')
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

  const handlePublishComment = async () => {
    if (!audioBlob) return
    if (duration < 2) {
      setError('Komentar suara minimal 2 detik.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const fileName = `comments/${postId}/${currentUserId}_${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-posts')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('voice-posts')
        .getPublicUrl(uploadData.path)

      const { error: dbError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          audio_url: publicUrl,
          duration,
        })

      if (dbError) throw dbError

      onCommentAdded()
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message || 'Gagal mengirim komentar suara.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-center">Balas dengan Suara</h3>
        <p className="text-xs text-neutral-400 text-center">Maksimal 30 detik</p>

        <div className="flex flex-col items-center justify-center p-6 bg-neutral-950 rounded-xl space-y-3">
          <div className="text-3xl font-mono font-bold">
            00:{duration < 10 ? `0${duration}` : duration}
          </div>

          {!audioUrl ? (
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-5 rounded-full transition ${
                recording ? 'bg-red-500 animate-pulse' : 'bg-white text-black'
              }`}
            >
              {recording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button onClick={() => { setAudioBlob(null); setAudioUrl(null); setDuration(0); }} className="p-3 bg-neutral-800 rounded-full">
                <RotateCcw className="w-5 h-5" />
              </button>
              <audio src={audioUrl} controls className="hidden" id="comment-preview-player" />
              <button onClick={() => (document.getElementById('comment-preview-player') as HTMLAudioElement)?.play()} className="p-3 bg-white text-black rounded-full">
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          )}
        </div>

        {audioUrl && (
          <button
            onClick={handlePublishComment}
            disabled={uploading}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{uploading ? 'Sending...' : 'Kirim Komentar Voice'}</span>
          </button>
        )}

        {error && <p className="text-xs text-center text-red-400">{error}</p>}
      </div>
    </div>
  )
}
