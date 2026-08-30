import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/PostCard'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      audio_url,
      duration,
      caption,
      created_at,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pb-24 bg-black text-white">
      <header className="w-full max-w-md py-4 mb-4 border-b border-neutral-800 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Vinger</h1>
        <span className="text-xs text-neutral-400">Voice Feed</span>
      </header>

      <div className="w-full max-w-md space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12 space-y-2">
            <p className="text-neutral-400">Belum ada voice post.</p>
            <p className="text-xs text-neutral-600">Jadilah yang pertama merekam suara di Vinger!</p>
          </div>
        )}
      </div>
    </main>
  )
}
