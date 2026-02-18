import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { week_id, ingredient_name } = await req.json()

  if (!ingredient_name) {
    return NextResponse.json({ error: 'ingredient_name is required' }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from('shopping_list_items')
    .insert({
      user_id: user.id,
      week_id: week_id || null,
      ingredient_name: ingredient_name.trim(),
      quantity: null,
      unit: null,
      checked: false,
      is_manual: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item }, { status: 201 })
}
