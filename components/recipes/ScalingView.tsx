'use client'

import { useState } from 'react'
import type { RecipeIngredient, RecipeStep } from '@/lib/types'

interface Props {
  defaultServings: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

function formatQty(quantity: number): string {
  if (quantity % 1 === 0) return String(quantity)
  if (Math.abs(quantity - Math.round(quantity * 2) / 2) < 0.01) {
    // Can represent as X.5
    return quantity.toFixed(1).replace(/\.0$/, '')
  }
  return quantity.toFixed(1).replace(/\.0$/, '')
}

export function ScalingView({ defaultServings, ingredients, steps }: Props) {
  const [servings, setServings] = useState(defaultServings)
  const scale = defaultServings > 0 ? servings / defaultServings : 1

  return (
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
  )
}
