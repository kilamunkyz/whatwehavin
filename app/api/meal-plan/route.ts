import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeekStart, toDateString } from '@/lib/planner/weekDates'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekParam = searchParams.get('week') // 'YYYY-MM-DD'

  const weekStart = weekParam
    ? weekParam
    : toDateString(getWeekStart(new Date()))

  // Upsert week record
  const { data: week, error: weekError } = await supabase
    .from('meal_plan_weeks')
    .upsert(
      { user_id: user.id, week_start_date: weekStart },
      { onConflict: 'user_id,week_start_date' }
    )
    .select()
    .single()

  if (weekError)
    return NextResponse.json({ error: weekError.message }, { status: 500 })

  // Fetch all slots with recipe summary
  const { data: slots, error: slotsError } = await supabase
    .from('meal_plan_slots')
    .select(
      `*, recipe:recipes(id, title, image_url, category, servings)`
    )
    .eq('week_id', week.id)

  if (slotsError)
    return NextResponse.json({ error: slotsError.message }, { status: 500 })

  return NextResponse.json({ week, slots: slots ?? [] })
}
