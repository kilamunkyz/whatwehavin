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

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Week navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-stone-800">Meal Planner</h1>
        <Link
          href="/shopping"
          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          🛒 Shopping list
        </Link>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-2">
        <button
          onClick={() => navigateWeek(-1)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100 transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm font-medium text-stone-600 text-center">
          {formatDisplayDate(weekStartDate)} – {formatDisplayDate(weekDates[6])}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm hover:bg-stone-100 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Vertical day list */}
      <div className="space-y-3">
        {DAYS.map((day, dayIndex) => (
          <div key={day} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {/* Day header */}
            <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center justify-between">
              <span className="font-semibold text-stone-700">{day}</span>
              <span className="text-xs text-stone-400">{formatDisplayDate(weekDates[dayIndex])}</span>
            </div>
            {/* Meal slots */}
            <div className="divide-y divide-stone-100">
              {MEAL_TYPES.map((mealType) => {
                const slot = getSlot(dayIndex, mealType)
                return (
                  <div key={mealType} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide w-16 shrink-0 capitalize">
                      {mealType}
                    </span>
                    <div className="flex-1">
                      <MealCell
                        slot={slot}
                        onAdd={() => setPickerTarget({ dayIndex, mealType })}
                        onRemove={() => slot && handleRemoveSlot(slot.id)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
      <div className="flex items-center justify-between gap-2 group">
        {slot.recipe ? (
          <Link
            href={`/recipes/${slot.recipe.id}`}
            className="text-sm font-medium text-amber-800 hover:underline flex-1"
          >
            {label}
          </Link>
        ) : (
          <p className="text-sm text-stone-600 flex-1">{label}</p>
        )}
        <button
          onClick={onRemove}
          className="shrink-0 w-5 h-5 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 text-base leading-none flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 text-stone-300 hover:text-amber-500 transition-colors text-sm"
    >
      <span className="text-lg leading-none">+</span>
      <span>Add</span>
    </button>
  )
}
