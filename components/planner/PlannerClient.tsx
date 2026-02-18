'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  fromDateString,
  formatDisplayDate,
  addWeeks,
  toDateString,
  getWeekDates,
} from '@/lib/planner/weekDates'
import { RecipePicker } from './RecipePicker'
import type { MealPlanSlot, MealPlanWeek, MealType, Recipe } from '@/lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']

interface Props {
  week: MealPlanWeek
  initialSlots: MealPlanSlot[]
  allRecipes: Recipe[]
  weekStart: string
}

interface PickerTarget {
  dayIndex: number
  mealType: MealType
}

export function PlannerClient({ week, initialSlots, allRecipes, weekStart }: Props) {
  const router = useRouter()
  const [slots, setSlots] = useState<MealPlanSlot[]>(initialSlots)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [loading, setLoading] = useState(false)

  const weekStartDate = fromDateString(weekStart)
  const weekDates = getWeekDates(weekStartDate)

  function getSlot(dayIndex: number, mealType: MealType) {
    return slots.find(
      (s) => s.day_of_week === dayIndex && s.meal_type === mealType
    )
  }

  function navigateWeek(delta: number) {
    const newDate = addWeeks(weekStartDate, delta)
    router.push(`/planner?week=${toDateString(newDate)}`)
  }

  async function handleAddSlot(
    dayIndex: number,
    mealType: MealType,
    recipe: Recipe | null,
    freeText?: string
  ) {
    setPickerTarget(null)
    setLoading(true)

    const res = await fetch('/api/meal-plan/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_id: week.id,
        day_of_week: dayIndex,
        meal_type: mealType,
        recipe_id: recipe?.id ?? null,
        free_text: freeText ?? null,
        servings: recipe?.servings ?? null,
      }),
    })

    if (res.ok) {
      const { slot } = await res.json()
      setSlots((prev) => {
        const filtered = prev.filter(
          (s) => !(s.day_of_week === dayIndex && s.meal_type === mealType)
        )
        return [...filtered, slot]
      })
    }
    setLoading(false)
  }

  async function handleRemoveSlot(slotId: string) {
    await fetch(`/api/meal-plan/slots/${slotId}`, { method: 'DELETE' })
    setSlots((prev) => prev.filter((s) => s.id !== slotId))
  }

  const isCurrentWeek =
    weekStart === toDateString(new Date())

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Meal Planner</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium text-stone-600 min-w-[160px] text-center">
            {formatDisplayDate(weekStartDate)} –{' '}
            {formatDisplayDate(weekDates[6])}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100 transition-colors"
          >
            Next →
          </button>
          <Link
            href="/shopping"
            className="ml-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            🛒 Shopping list
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
            <div />
            {DAYS.map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  {day}
                </div>
                <div className="text-xs text-stone-400">
                  {formatDisplayDate(weekDates[i])}
                </div>
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType) => (
            <div
              key={mealType}
              className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1"
            >
              <div className="flex items-center">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide capitalize">
                  {mealType}
                </span>
              </div>
              {DAYS.map((_, dayIndex) => {
                const slot = getSlot(dayIndex, mealType)
                return (
                  <MealCell
                    key={dayIndex}
                    slot={slot}
                    onAdd={() => setPickerTarget({ dayIndex, mealType })}
                    onRemove={() => slot && handleRemoveSlot(slot.id)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe picker modal */}
      {pickerTarget && (
        <RecipePicker
          recipes={allRecipes}
          dayLabel={DAYS[pickerTarget.dayIndex]}
          mealType={pickerTarget.mealType}
          onSelect={(recipe, freeText) =>
            handleAddSlot(pickerTarget.dayIndex, pickerTarget.mealType, recipe, freeText)
          }
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  )
}

function MealCell({
  slot,
  onAdd,
  onRemove,
}: {
  slot: MealPlanSlot | undefined
  onAdd: () => void
  onRemove: () => void
}) {
  if (slot) {
    const label = slot.recipe?.title ?? slot.free_text ?? '?'
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 min-h-[64px] group relative">
        {slot.recipe ? (
          <Link
            href={`/recipes/${slot.recipe.id}`}
            className="text-xs font-medium text-amber-800 leading-snug line-clamp-3 hover:underline block"
          >
            {label}
          </Link>
        ) : (
          <p className="text-xs text-stone-600 leading-snug line-clamp-3">{label}</p>
        )}
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-stone-400 hover:text-red-500 text-xs leading-none hidden group-hover:flex items-center justify-center shadow-sm border border-stone-200"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onAdd}
      className="border-2 border-dashed border-stone-200 rounded-lg min-h-[64px] flex items-center justify-center text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors text-xl"
    >
      +
    </button>
  )
}
