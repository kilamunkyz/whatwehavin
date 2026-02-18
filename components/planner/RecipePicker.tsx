'use client'

import { useState } from 'react'
import type { MealType, Recipe, Category } from '@/lib/types'

interface Props {
  recipes: Recipe[]
  dayLabel: string
  mealType: MealType
  onSelect: (recipe: Recipe | null, freeText?: string) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<Category, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Desserts',
}

export function RecipePicker({ recipes, dayLabel, mealType, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [freeTextMode, setFreeTextMode] = useState(false)
  const [freeText, setFreeText] = useState('')

  const filtered = recipes.filter((r) => {
    const matchCat = categoryFilter === 'all' || r.category === categoryFilter
    const matchSearch =
      !search || r.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div>
            <h3 className="font-semibold text-stone-800">Add meal</h3>
            <p className="text-xs text-stone-400 capitalize">
              {dayLabel} · {mealType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 px-4 pt-3 pb-2">
          {(['all', 'starter', 'main', 'dessert'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              No recipes found
            </p>
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {recipe.title}
                  </p>
                  <p className="text-xs text-stone-400 capitalize">
                    {recipe.category} · serves {recipe.servings}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Free text option */}
        <div className="border-t border-stone-100 p-4 space-y-2">
          {!freeTextMode ? (
            <button
              onClick={() => setFreeTextMode(true)}
              className="text-sm text-stone-500 hover:text-amber-700 font-medium"
            >
              + Add without a recipe (free text)
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && freeText.trim()) {
                    onSelect(null, freeText.trim())
                  }
                }}
                placeholder="e.g. Leftover curry, Takeaway…"
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => freeText.trim() && onSelect(null, freeText.trim())}
                disabled={!freeText.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-40"
              >
                Add
              </button>
              <button
                onClick={() => setFreeTextMode(false)}
                className="px-3 py-2 text-stone-400 hover:text-stone-600 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
