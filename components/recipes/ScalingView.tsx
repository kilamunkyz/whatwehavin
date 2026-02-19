'use client'

import { useState } from 'react'
import type { RecipeIngredient, RecipeStep } from '@/lib/types'

interface NutritionData {
  calories_per_serving: number
  protein_per_serving: number
  carbs_per_serving: number
  fat_per_serving: number
}

interface Props {
  recipeId: string
  defaultServings: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  initialNutrition: NutritionData | null
}

function formatQty(quantity: number): string {
  if (quantity % 1 === 0) return String(quantity)
  return quantity.toFixed(1).replace(/\.0$/, '')
}

export function ScalingView({ recipeId, defaultServings, ingredients, steps, initialNutrition }: Props) {
  const [servings, setServings] = useState(defaultServings)
  const scale = defaultServings > 0 ? servings / defaultServings : 1

  const [nutrition, setNutrition] = useState<NutritionData | null>(initialNutrition)
  const [calculating, setCalculating] = useState(false)
  const [nutritionError, setNutritionError] = useState<string | null>(null)

  async function handleCalculateNutrition() {
    setCalculating(true)
    setNutritionError(null)
    try {
      const res = await fetch(`/api/nutrition/${recipeId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNutritionError(data.error || 'Failed to calculate nutrition')
      } else {
        setNutrition(data)
      }
    } catch {
      setNutritionError('Network error — please try again')
    } finally {
      setCalculating(false)
    }
  }

  // Scale macros with serving count change
  const scaleNutrient = (perServing: number) =>
    Math.round((perServing * defaultServings) / servings)

  return (
    <div className="space-y-6">
      {/* Nutrition strip */}
      {nutrition ? (
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-stone-700">
                ~{scaleNutrient(nutrition.calories_per_serving)} kcal
                <span className="font-normal text-stone-400 ml-1">per serving</span>
              </span>
              <span className="text-stone-200 hidden sm:inline">|</span>
              <span className="text-xs text-stone-500">
                Protein <span className="font-medium text-stone-700">{scaleNutrient(nutrition.protein_per_serving)}g</span>
              </span>
              <span className="text-xs text-stone-500">
                Carbs <span className="font-medium text-stone-700">{scaleNutrient(nutrition.carbs_per_serving)}g</span>
              </span>
              <span className="text-xs text-stone-500">
                Fat <span className="font-medium text-stone-700">{scaleNutrient(nutrition.fat_per_serving)}g</span>
              </span>
            </div>
            <button
              onClick={handleCalculateNutrition}
              disabled={calculating}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors shrink-0 ml-2"
              title="Recalculate"
            >
              {calculating ? '…' : '↻'}
            </button>
          </div>
          {/* Macro bar */}
          {(() => {
            const total =
              nutrition.protein_per_serving +
              nutrition.carbs_per_serving +
              nutrition.fat_per_serving
            if (total === 0) return null
            const pPct = (nutrition.protein_per_serving / total) * 100
            const cPct = (nutrition.carbs_per_serving / total) * 100
            const fPct = (nutrition.fat_per_serving / total) * 100
            return (
              <div className="flex h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-400" style={{ width: `${pPct}%` }} title={`Protein ${Math.round(pPct)}%`} />
                <div className="bg-amber-400" style={{ width: `${cPct}%` }} title={`Carbs ${Math.round(cPct)}%`} />
                <div className="bg-red-400" style={{ width: `${fPct}%` }} title={`Fat ${Math.round(fPct)}%`} />
              </div>
            )
          })()}
          <p className="text-xs text-stone-400">Estimated — values are approximate</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleCalculateNutrition}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-colors disabled:opacity-50"
          >
            {calculating ? (
              <>
                <svg className="animate-spin w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Calculating…
              </>
            ) : (
              '🔢 Calculate nutrition'
            )}
          </button>
          {nutritionError && (
            <p className="text-sm text-red-500">{nutritionError}</p>
          )}
        </div>
      )}

      {/* Ingredients + Method grid */}
      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        {/* Ingredients column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-800">Ingredients</h2>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
              >
                −
              </button>
              <span className="w-20 text-center text-stone-700 font-medium">
                Serves {servings}
              </span>
              <button
                onClick={() => setServings((s) => Math.min(50, s + 1))}
                className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
              >
                +
              </button>
            </div>
          </div>

          <ul className="space-y-1.5">
            {ingredients.map((ing) => (
              <li key={ing.id} className="text-sm text-stone-700 flex gap-2">
                <span className="font-medium text-stone-900 shrink-0">
                  {ing.quantity !== null
                    ? `${formatQty(ing.quantity * scale)}${ing.unit ? ' ' + ing.unit : ''}`
                    : ''}
                </span>
                <span>
                  {ing.name}
                  {ing.notes && (
                    <span className="text-stone-400">, {ing.notes}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {scale !== 1 && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Scaled from {defaultServings} serves
            </p>
          )}
        </div>

        {/* Method column */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">Method</h2>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-sm font-bold flex items-center justify-center">
                  {step.step_number}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed pt-0.5">
                  {step.instruction}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
