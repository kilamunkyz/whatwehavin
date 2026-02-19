'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { TAGS } from '@/lib/types'

const CATEGORY_TABS = [
  { label: 'All', value: '' },
  { label: 'Starters', value: 'starter' },
  { label: 'Mains', value: 'main' },
  { label: 'Desserts', value: 'dessert' },
]

// Nice emoji/label pairs for the tag pills
const TAG_META: Record<string, string> = {
  sandwich: '🥪 Sandwich',
  chinese: '🥢 Chinese',
  italian: '🍝 Italian',
  curry: '🍛 Curry',
  thai: '🌶️ Thai',
  fish: '🐟 Fish',
  chicken: '🍗 Chicken',
  beef: '🥩 Beef',
  pork: '🐷 Pork',
  lamb: '🍖 Lamb',
  vegetarian: '🥦 Vegetarian',
  vegan: '🌱 Vegan',
  soup: '🍲 Soup',
  salad: '🥗 Salad',
  pasta: '🍜 Pasta',
  mexican: '🌮 Mexican',
  japanese: '🍱 Japanese',
  indian: '🫕 Indian',
  pub: '🍺 Pub',
  quick: '⚡ Quick',
  'slow-cook': '🕐 Slow Cook',
}

interface Props {
  activeCategory: string
  activeTags: string[]
}

export function FilterBar({ activeCategory, activeTags }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showTags, setShowTags] = useState(activeTags.length > 0)

  const buildUrl = useCallback(
    (category: string, tags: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (category) {
        params.set('category', category)
      } else {
        params.delete('category')
      }
      if (tags.length > 0) {
        params.set('tags', tags.join(','))
      } else {
        params.delete('tags')
      }
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, searchParams]
  )

  function handleCategoryClick(value: string) {
    router.push(buildUrl(value, activeTags))
  }

  function toggleTag(tag: string) {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag]
    router.push(buildUrl(activeCategory, next))
  }

  function clearAll() {
    router.push(pathname)
    setShowTags(false)
  }

  const hasFilters = activeCategory || activeTags.length > 0

  return (
    <div className="space-y-3">
      {/* Row 1: category tabs + filter button */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => handleCategoryClick(tab.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowTags((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            activeTags.length > 0
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filter
          {activeTags.length > 0 && (
            <span className="bg-white text-amber-700 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeTags.length}
            </span>
          )}
        </button>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Row 2: tag panel (expandable) */}
      {showTags && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Filter by tag</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const isActive = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    isActive
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-stone-600 border-stone-300 hover:border-amber-400 hover:text-amber-700'
                  }`}
                >
                  {TAG_META[tag] ?? tag}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Active tag chips (shown even when panel is closed) */}
      {!showTags && activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors"
            >
              {TAG_META[tag] ?? tag}
              <span className="text-amber-500 text-xs leading-none">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
