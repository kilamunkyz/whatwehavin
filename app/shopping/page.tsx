import { createClient } from '@/lib/supabase/server'
import { getWeekStart, toDateString } from '@/lib/planner/weekDates'
import { ShoppingClient } from '@/components/shopping/ShoppingClient'
import type { ShoppingListItem, MealPlanWeek } from '@/lib/types'

export default async function ShoppingPage({
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

  // Get or create the week
  const { data: week } = await supabase
    .from('meal_plan_weeks')
    .upsert(
      { user_id: user!.id, week_start_date: weekStart },
      { onConflict: 'user_id,week_start_date' }
    )
    .select()
    .single()

  // Get shopping list for this week
  const { data: items } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('week_id', week!.id)
    .order('is_manual', { ascending: true })
    .order('ingredient_name', { ascending: true })

  return (
    <ShoppingClient
      week={week as MealPlanWeek}
      initialItems={(items as ShoppingListItem[]) ?? []}
    />
  )
}
