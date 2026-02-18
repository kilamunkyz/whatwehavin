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
  { href: '/pub-menu', label: 'Pub Menu' },
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
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/recipes" className="flex items-center">
          <Image
            src="/logo.png"
            alt="WhatWeHavin"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="ml-3 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
