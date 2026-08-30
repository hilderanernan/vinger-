import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostCard from '@/components/feed/PostCard'
import SignOutButton from '@/components/auth/SignOutButton'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: userPosts } = await supabase
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pb-24 bg-black text-white">
      <header className="w-full max-w-md py-4 mb-4 border-b border-neutral-800 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <SignOutButton />
      </header>

      <div className="w-full max-w-md space-y-6">
        {/* Profile Card */}
        <div className="flex items-center space-x-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xl text-neutral-300">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile?.display_name || 'Vinger User'}</h2>
            <p className="text-sm text-neutral-400">@{profile?.username}</p>
            <p className="text-xs text-neutral-500 mt-1">{userPosts?.length || 0} Voice Posts</p>
          </div>
        </div>

        {/* User Posts Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Postingan Saya</h3>
          {userPosts && userPosts.length > 0 ? (
            userPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500 text-sm">
              Kamu belum pernah buat voice post.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
