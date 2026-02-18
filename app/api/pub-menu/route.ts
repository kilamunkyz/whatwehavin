import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

async function getRandomRecipe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  category: Category
) {
  const { data } = await supabase
    .from('recipes')
    .select('id, title, description, image_url, category')
    .eq('user_id', userId)
    .eq('category', category)

  if (!data || data.length === 0) return null
  return data[Math.floor(Math.random() * data.length)]
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [starter, main, dessert] = await Promise.all([
    getRandomRecipe(supabase, user.id, 'starter'),
    getRandomRecipe(supabase, user.id, 'main'),
    getRandomRecipe(supabase, user.id, 'dessert'),
  ])

  return NextResponse.json({ starter, main, dessert })
}
