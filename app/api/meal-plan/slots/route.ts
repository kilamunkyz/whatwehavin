import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { week_id, day_of_week, meal_type, recipe_id, free_text, servings } = body

  if (week_id === undefined || day_of_week === undefined || !meal_type) {
    return NextResponse.json(
      { error: 'week_id, day_of_week, and meal_type are required' },
      { status: 400 }
    )
  }

  // Verify the week belongs to this user
  const { data: week } = await supabase
    .from('meal_plan_weeks')
    .select('id')
    .eq('id', week_id)
    .eq('user_id', user.id)
    .single()

  if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

  const { data: slot, error } = await supabase
    .from('meal_plan_slots')
    .upsert(
      {
        week_id,
        day_of_week,
        meal_type,
        recipe_id: recipe_id || null,
        free_text: free_text || null,
        servings: servings || null,
      },
      { onConflict: 'week_id,day_of_week,meal_type' }
    )
    .select(`*, recipe:recipes(id, title, image_url, category, servings)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ slot }, { status: 201 })
}
