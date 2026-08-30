import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PostCard from '@/components/feed/PostCard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: rawPost, error } = await supabase
    .from('posts')
    .select(`
      id,
      audio_url,
      duration,
      caption,
      created_at,
      likes_count,
      comments_count,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !rawPost) {
    notFound()
  }

  // Cast profiles array/object agar sesuai interface PostCard
  const formattedPost = {
    ...rawPost,
    profiles: Array.isArray(rawPost.profiles) ? rawPost.profiles[0] : rawPost.profiles
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pb-36 bg-black text-white">
      <header className="w-full max-w-md py-4 mb-4 border-b border-neutral-800 flex items-center space-x-3 sticky top-0 bg-black/90 backdrop-blur-md z-40">
        <Link href="/" className="p-1 text-neutral-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Voice Thread</h1>
      </header>

      <div className="w-full max-w-md space-y-4">
        <PostCard post={formattedPost as any} currentUserId={user.id} />
      </div>
    </main>
  )
}
