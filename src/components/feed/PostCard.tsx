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
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showCommentsList, setShowCommentsList] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  
  const cardRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  // Auto-Play on Scroll via Intersection Observer (TikTok UX)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            document.querySelectorAll('audio').forEach((el) => {
              if (el !== audioRef.current) el.pause()
            })
            audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
          } else {
            audioRef.current?.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.7 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

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

  return (
    <div ref={cardRef} className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
      <audio ref={audioRef} src={post.audio_url} onEnded={() => setIsPlaying(false)} className="hidden" />
      
      {/* Header */}
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

      {/* Audio Control Bar */}
      <div className="flex items-center space-x-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800/60">
        <button
          onClick={() => {
            if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
            else { audioRef.current?.play(); setIsPlaying(true); }
          }}
          className="p-3 bg-white text-black rounded-full"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className={`h-full bg-white transition-all ${isPlaying ? 'w-full duration-10000' : 'w-0'}`} />
          </div>
          <p className="text-xs font-mono text-neutral-400 text-right">00:{post.duration < 10 ? `0${post.duration}` : post.duration}</p>
        </div>
      </div>

      {post.caption && <p className="text-sm text-neutral-200">{post.caption}</p>}

      {/* Action Buttons */}
      <div className="flex items-center justify-between text-neutral-400 text-xs pt-2 border-t border-neutral-800/50">
        <button onClick={handleLikeToggle} className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : ''}`}>
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likesCount} Likes</span>
        </button>

        <button onClick={toggleCommentsList} className="flex items-center space-x-1 hover:text-white">
          <MessageSquare className="w-4 h-4" />
          <span>{commentsCount} Voice Comments</span>
        </button>
      </div>

      {/* Audio Comments Drawer */}
      {showCommentsList && (
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Komentar Suara</h4>
            <button
              onClick={() => setShowCommentModal(true)}
              className="text-xs px-3 py-1 bg-white text-black font-semibold rounded-full"
            >
              + Voice Reply
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-center space-x-3 bg-neutral-950 p-2 rounded-lg border border-neutral-800 text-xs">
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
