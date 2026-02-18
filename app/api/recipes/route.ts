import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') as Category | null
  const tags = searchParams
    .get('tags')
    ?.split(',')
    .filter(Boolean)

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (tags?.length) query = query.contains('tags', tags)

  const { data, error } = await query
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ recipes: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, servings, image_url, source_url, category, tags, ingredients, steps } =
    body

  if (!title || !category) {
    return NextResponse.json({ error: 'title and category are required' }, { status: 400 })
  }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      servings: servings || 2,
      image_url: image_url || null,
      source_url: source_url || null,
      category,
      tags: tags || [],
    })
    .select()
    .single()

  if (recipeError)
    return NextResponse.json({ error: recipeError.message }, { status: 500 })

  if (ingredients?.length) {
    await supabase
      .from('recipe_ingredients')
      .insert(ingredients.map((ing: Record<string, unknown>) => ({ ...ing, recipe_id: recipe.id })))
  }

  if (steps?.length) {
    await supabase
      .from('recipe_steps')
      .insert(steps.map((s: Record<string, unknown>) => ({ ...s, recipe_id: recipe.id })))
  }

  return NextResponse.json({ recipe }, { status: 201 })
}
