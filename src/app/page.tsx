import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Vinger — Media Sosial Berbasis Suara',
  description: 'Vinger adalah media sosial berbasis suara. Rekam, bagikan, dan dengarkan cerita lewat suara asli, bukan sekadar ketikan.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white text-center space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Vinger</h1>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
          Media sosial berbasis suara. Rekam, bagikan, dan dengarkan cerita nyata lewat suara asli — bukan sekadar ketikan.
        </p>
      </div>

      <div className="space-y-3 text-left max-w-xs mx-auto text-sm text-neutral-300">
        <p>🎙️ Posting suara, bukan teks</p>
        <p>💬 Balas komentar dengan suara juga</p>
        <p>❤️ Like dan temukan suara-suara baru</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/login"
          className="block w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition text-sm"
        >
          Masuk / Daftar
        </Link>
      </div>

      <p className="text-xs text-neutral-600">
        Vinger — dengar dan didengar.
      </p>
    </main>
  )
}
