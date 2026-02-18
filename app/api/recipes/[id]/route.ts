import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(
      `*, recipe_ingredients(* order by sort_order asc), recipe_steps(* order by step_number asc)`
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !recipe)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ recipe })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ingredients, steps, ...recipeFields } = body

  // Update recipe fields
  const { data: recipe, error } = await supabase
    .from('recipes')
    .update(recipeFields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace ingredients if provided
  if (ingredients !== undefined) {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
    if (ingredients.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        ingredients.map((ing: Record<string, unknown>, i: number) => ({
          ...ing,
          recipe_id: id,
          sort_order: i,
        }))
      )
    }
  }

  // Replace steps if provided
  if (steps !== undefined) {
    await supabase.from('recipe_steps').delete().eq('recipe_id', id)
    if (steps.length > 0) {
      await supabase.from('recipe_steps').insert(
        steps.map((s: Record<string, unknown>, i: number) => ({
          ...s,
          recipe_id: id,
          step_number: i + 1,
        }))
      )
    }
  }

  return NextResponse.json({ recipe })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
