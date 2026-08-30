'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Heart, MessageSquare, Volume2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AudioCommentModal from '../comments/AudioCommentModal'

interface PostProps {
  post: {
    id: string
    audio_url: string
    duration: number
    caption: string | null
    created_at: string
    likes_count: number
    comments_count: number
    profiles: {
      username: string
      display_name: string
      avatar_url: string | null
    }
  }
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showCommentsList, setShowCommentsList] = useState(false)
  const [comments, setComments] = useState<any[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (currentUserId) checkUserLike()
  }, [currentUserId])

  const checkUserLike = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .single()

    if (data) setIsLiked(true)
  }

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Hentikan semua audio lain yang sedang berputar di halaman
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) {
          el.pause()
        }
      })
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const total = audioRef.current.duration || post.duration
      setCurrentTime(current)
      setProgress((current / total) * 100)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        id,
        audio_url,
        duration,
        created_at,
        profiles (username, display_name)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (data) setComments(data)
  }

  const toggleCommentsList = () => {
    if (!showCommentsList) loadComments()
    setShowCommentsList(!showCommentsList)
  }

  const handleLikeToggle = async () => {
    if (!currentUserId) return

    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId })
    }
  }

  const formatTime = (secs: number) => {
    const s = Math.floor(secs)
    return `00:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-md">
      <audio
        ref={audioRef}
        src={post.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-300">
            {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{post.profiles?.display_name || post.profiles?.username}</h3>
            <p className="text-xs text-neutral-400">@{post.profiles?.username}</p>
          </div>
        </div>
        {isPlaying && <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
      </div>

      {/* Audio Card Player */}
      <div className="flex items-center space-x-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
        <button
          onClick={togglePlay}
          className={`p-3.5 rounded-full transition-transform active:scale-95 ${
            isPlaying ? 'bg-emerald-500 text-black' : 'bg-white text-black'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 space-y-1.5">
          {/* Progress Bar Visualizer */}
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-emerald-400 transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(post.duration)}</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      {post.caption && <p className="text-sm text-neutral-200 leading-relaxed">{post.caption}</p>}

      {/* Interaction Bar */}
      <div className="flex items-center justify-between text-neutral-400 text-xs pt-2 border-t border-neutral-800/50">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center space-x-1.5 transition ${isLiked ? 'text-red-500 font-semibold' : 'hover:text-white'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likesCount} Likes</span>
        </button>

        <button onClick={toggleCommentsList} className="flex items-center space-x-1.5 hover:text-white transition">
          <MessageSquare className="w-4 h-4" />
          <span>{commentsCount} Voice Comments</span>
        </button>
      </div>

      {/* Voice Comments Section */}
      {showCommentsList && (
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Komentar Suara</h4>
            <button
              onClick={() => setShowCommentModal(true)}
              className="text-xs px-3 py-1 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition"
            >
              + Reply Voice
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-center space-x-3 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs">
                  <span className="font-semibold text-neutral-300">@{comment.profiles?.username}:</span>
                  <audio controls src={comment.audio_url} className="h-7 w-full max-w-[180px]" />
                  <span className="font-mono text-[10px] text-neutral-500">{comment.duration}s</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-neutral-500 text-center py-2">Belum ada balasan suara.</p>
            )}
          </div>
        </div>
      )}

      {showCommentModal && currentUserId && (
        <AudioCommentModal
          postId={post.id}
          currentUserId={currentUserId}
          onClose={() => setShowCommentModal(false)}
          onCommentAdded={() => {
            setCommentsCount((prev) => prev + 1)
            loadComments()
          }}
        />
      )}
    </div>
  )
}
