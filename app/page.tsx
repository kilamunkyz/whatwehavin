import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginButton } from '@/components/ui/LoginButton'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/recipes')

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="WhatWeHavin"
            width={320}
            height={96}
            className="w-72 h-auto"
            priority
          />
        </div>
        <div className="space-y-3 pt-2 text-stone-500 text-sm">
          <p>📥 Import from BBC Good Food</p>
          <p>📅 Weekly meal planner</p>
          <p>🛒 Auto shopping list</p>
          <p>🍽️ Pub menu inspiration</p>
        </div>
        <LoginButton />
      </div>
    </div>
  )
}
