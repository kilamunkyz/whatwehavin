import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeBBCGoodFood } from '@/lib/scraper/bbcGoodFood'
import type { Category } from '@/lib/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { url, category } = body as { url: string; category: Category }

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }

  // Validate URL is BBC Good Food (currently the only supported source)
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!parsedUrl.hostname.includes('bbcgoodfood.com')) {
    return NextResponse.json(
      { error: 'Only BBC Good Food URLs are supported right now. More sites coming soon!' },
      { status: 400 }
    )
  }

  try {
    const scraped = await scrapeBBCGoodFood(url)

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: scraped.title,
        description: scraped.description,
        servings: scraped.servings,
        image_url: scraped.image_url,
        source_url: scraped.source_url,
        category,
        tags: [],
      })
      .select()
      .single()

    if (recipeError) throw recipeError

    // Insert ingredients
    if (scraped.ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(
          scraped.ingredients.map((ing) => ({ ...ing, recipe_id: recipe.id }))
        )
      if (ingError) console.error('Ingredients insert error:', ingError)
    }

    // Insert steps
    if (scraped.steps.length > 0) {
      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(
          scraped.steps.map((s) => ({ ...s, recipe_id: recipe.id }))
        )
      if (stepsError) console.error('Steps insert error:', stepsError)
    }

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to import recipe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
