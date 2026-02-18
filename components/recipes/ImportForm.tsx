'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
]

export function ImportForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState<Category>('main')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), category }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to import recipe')
        return
      }

      router.push(`/recipes/${data.recipe.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-stone-700">
          BBC Good Food URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.bbcgoodfood.com/recipes/..."
          required
          className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-stone-700">Category</label>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                category === cat.value
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Importing...
          </>
        ) : (
          'Import Recipe'
        )}
      </button>

      <p className="text-xs text-stone-400 text-center">
        Currently supports BBC Good Food. More sites coming soon.
      </p>
    </form>
  )
}
