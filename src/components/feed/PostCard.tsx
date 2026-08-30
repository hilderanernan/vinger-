'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Heart, MessageSquare } from 'lucide-react'

interface PostProps {
  post: {
    id: string
    audio_url: string
    duration: number
    caption: string | null
    created_at: string
    profiles: {
      username: string
      display_name: string
      avatar_url: string | null
    }
  }
}

export default function PostCard({ post }: PostProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Stop all other audio players on page if any
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) el.pause()
      })
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
      <audio
        ref={audioRef}
        src={post.audio_url}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      
      {/* User Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-300">
          {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{post.profiles?.display_name || post.profiles?.username}</h3>
          <p className="text-xs text-neutral-400">@{post.profiles?.username}</p>
        </div>
      </div>

      {/* Audio Waveform / Player Trigger */}
      <div className="flex items-center space-x-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800/50">
        <button
          onClick={togglePlay}
          className="p-3 bg-white text-black rounded-full hover:scale-105 transition"
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

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-neutral-200">{post.caption}</p>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-6 text-neutral-400 text-xs pt-1">
        <button className="flex items-center space-x-1 hover:text-white">
          <Heart className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-white">
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>
    </div>
  )
}
