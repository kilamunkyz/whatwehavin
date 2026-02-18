'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/recipes', label: 'Recipes' },
  { href: '/planner', label: 'Planner' },
  { href: '/shopping', label: 'Shopping' },
  { href: '/pub-menu', label: 'Menu Generator' },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (pathname === '/') return null

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        {/* Logo row */}
        <div className="flex items-center justify-between py-2 border-b border-stone-100">
          <Link href="/recipes" className="flex items-center">
            <Image
              src="/logo.png"
              alt="WhatWeHavin"
              width={200}
              height={60}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            Sign out
          </button>
        </div>
        {/* Nav links row */}
        <div className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
