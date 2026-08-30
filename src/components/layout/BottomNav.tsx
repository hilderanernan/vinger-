'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Mic, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  // Hide nav on login page
  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-neutral-800 py-3 px-6 flex justify-around items-center z-50">
      <Link href="/" className={`flex flex-col items-center space-y-1 ${pathname === '/' ? 'text-white' : 'text-neutral-500'}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px]">Feed</span>
      </Link>
      <Link href="/create" className={`flex flex-col items-center space-y-1 ${pathname === '/create' ? 'text-white' : 'text-neutral-500'}`}>
        <div className="p-2 bg-white text-black rounded-full -mt-4 shadow-lg">
          <Mic className="w-5 h-5" />
        </div>
        <span className="text-[10px]">Record</span>
      </Link>
      <Link href="/profile" className={`flex flex-col items-center space-y-1 ${pathname === '/profile' ? 'text-white' : 'text-neutral-500'}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px]">Profile</span>
      </Link>
    </nav>
  )
}
