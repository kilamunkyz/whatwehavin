import { createClient } from '@/lib/supabase/server'
import { getWeekStart, toDateString } from '@/lib/planner/weekDates'
import { PlannerClient } from '@/components/planner/PlannerClient'
import type { MealPlanSlot, MealPlanWeek, Recipe } from '@/lib/types'

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week: weekParam } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const weekStart = weekParam || toDateString(getWeekStart(new Date()))

  // Upsert the week record
  const { data: week } = await supabase
    .from('meal_plan_weeks')
    .upsert(
      { user_id: user!.id, week_start_date: weekStart },
      { onConflict: 'user_id,week_start_date' }
    )
    .select()
    .single()

  // Fetch slots for this week
  const { data: slots } = await supabase
    .from('meal_plan_slots')
    .select(`*, recipe:recipes(id, title, image_url, category, servings)`)
    .eq('week_id', week!.id)

  // Fetch all user recipes for the picker
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, category, servings, image_url, tags')
    .eq('user_id', user!.id)
    .order('title')

  return (
    <PlannerClient
      week={week as MealPlanWeek}
      initialSlots={(slots as MealPlanSlot[]) ?? []}
      allRecipes={(recipes as Recipe[]) ?? []}
      weekStart={weekStart}
    />
  )
}
