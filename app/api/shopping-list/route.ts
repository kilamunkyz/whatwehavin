import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consolidateIngredients } from '@/lib/shopping/consolidate'
import type { RecipeIngredient } from '@/lib/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekId = searchParams.get('week_id')

  let query = supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', user.id)
    .order('is_manual', { ascending: true })
    .order('ingredient_name', { ascending: true })

  if (weekId) query = query.eq('week_id', weekId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data })
}

// POST /api/shopping-list — regenerate from meal plan
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { week_id } = await req.json()
  if (!week_id) {
    return NextResponse.json({ error: 'week_id is required' }, { status: 400 })
  }

  // Verify week ownership
  const { data: week } = await supabase
    .from('meal_plan_weeks')
    .select('id')
    .eq('id', week_id)
    .eq('user_id', user.id)
    .single()

  if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

  // Fetch all slots for the week that have a linked recipe
  const { data: slots } = await supabase
    .from('meal_plan_slots')
    .select(
      `id, recipe_id, servings, recipe:recipes(servings, recipe_ingredients(*))`
    )
    .eq('week_id', week_id)
    .not('recipe_id', 'is', null)

  // Build flat list of scaled ingredients
  const allIngredients: Array<{ name: string; quantity: number | null; unit: string | null }> = []

  for (const slot of slots ?? []) {
    const recipe = (slot.recipe as unknown) as { servings: number; recipe_ingredients: RecipeIngredient[] } | null
    if (!recipe) continue

    const recipeServings = recipe.servings
    const targetServings = slot.servings ?? recipeServings
    const scale = recipeServings > 0 ? targetServings / recipeServings : 1

    for (const ing of recipe.recipe_ingredients) {
      allIngredients.push({
        name: ing.name,
        quantity: ing.quantity !== null ? ing.quantity * scale : null,
        unit: ing.unit,
      })
    }
  }

  const consolidated = consolidateIngredients(allIngredients)

  // Before deleting auto items, capture which ingredient names are currently checked
  const { data: checkedItems } = await supabase
    .from('shopping_list_items')
    .select('ingredient_name, unit')
    .eq('week_id', week_id)
    .eq('checked', true)
    .eq('is_manual', false)

  const checkedSet = new Set(
    (checkedItems ?? []).map((i) => `${i.ingredient_name}::${i.unit ?? ''}`)
  )

  // Delete old auto-generated items for this week
  await supabase
    .from('shopping_list_items')
    .delete()
    .eq('week_id', week_id)
    .eq('is_manual', false)

  // Insert consolidated list
  if (consolidated.length > 0) {
    await supabase.from('shopping_list_items').insert(
      consolidated.map((item) => ({
        user_id: user.id,
        week_id,
        ingredient_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        checked: checkedSet.has(`${item.name}::${item.unit ?? ''}`),
        is_manual: false,
      }))
    )
  }

  // Return the full list (auto + manual)
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('week_id', week_id)
    .order('is_manual', { ascending: true })
    .order('ingredient_name', { ascending: true })

  return NextResponse.json({ items: items ?? [] })
}
