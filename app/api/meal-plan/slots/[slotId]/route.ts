import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via join
  const { data: slot } = await supabase
    .from('meal_plan_slots')
    .select(`id, meal_plan_weeks!inner(user_id)`)
    .eq('id', slotId)
    .single()

  if (!slot) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const week = (slot.meal_plan_weeks as unknown) as { user_id: string }
  if (week.user_id !== user.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('meal_plan_slots').delete().eq('id', slotId)

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data: slot, error } = await supabase
    .from('meal_plan_slots')
    .update(body)
    .eq('id', slotId)
    .select(`*, recipe:recipes(id, title, image_url, category, servings)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ slot })
}
