import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/ui/AuthForm'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/recipes')

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-6 w-full max-w-sm mx-auto px-6">
        <Image
          src="/logo.png"
          alt="WhatWeHavin"
          width={320}
          height={96}
          className="w-64 h-auto"
          priority
        />
        <AuthForm />
      </div>
    </div>
  )
}
