'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Category } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
]

interface SearchResult {
  title: string
  url: string
  image_url: string | null
  description: string | null
}

type Tab = 'search' | 'url'

export function ImportForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('search')

  // --- Search state ---
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Import state (shared) ---
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState<Category>('main')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // --- Search ---
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setSearchResults(null)
    setSelectedResult(null)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setSearchError(data.error || 'Search failed')
      } else {
        setSearchResults(data.results)
        if (data.results.length === 0) {
          setSearchError('No recipes found — try different keywords')
        }
      }
    } catch {
      setSearchError('Network error — please try again')
    } finally {
      setSearching(false)
    }
  }

  // --- Import (shared logic) ---
  async function handleImport(importUrl: string) {
    setImportError(null)
    setImporting(true)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, category }),
      })

      const data = await res.json()

      if (!res.ok) {
        setImportError(data.error || 'Failed to import recipe')
        return
      }

      router.push(`/recipes/${data.recipe.id}`)
    } catch {
      setImportError('Network error — please try again')
    } finally {
      setImporting(false)
    }
  }

  function handleSelectResult(result: SearchResult) {
    setSelectedResult(result)
    // Scroll category picker into view
    setTimeout(() => {
      document.getElementById('category-picker')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const categoryPicker = (
    <div id="category-picker" className="space-y-1.5">
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
  )

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
        <button
          onClick={() => { setTab('search'); setImportError(null) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'search' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          🔍 Search BBC Good Food
        </button>
        <button
          onClick={() => { setTab('url'); setImportError(null) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'url' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          🔗 Paste URL
        </button>
      </div>

      {/* ─── SEARCH TAB ─── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken fried rice, chocolate cake…"
              className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching…
                </>
              ) : (
                'Search'
              )}
            </button>
          </form>

          {searchError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
              {searchError}
            </div>
          )}

          {/* Results grid */}
          {searchResults && searchResults.length > 0 && !selectedResult && (
            <div className="space-y-2">
              <p className="text-xs text-stone-400">{searchResults.length} results — tap one to import</p>
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {searchResults.map((result) => (
                  <li key={result.url}>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition-all group"
                    >
                      {result.image_url ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                          <Image
                            src={result.image_url}
                            alt={result.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 text-sm leading-snug group-hover:text-amber-700 transition-colors">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span className="text-stone-300 group-hover:text-amber-500 transition-colors ml-auto shrink-0 text-lg">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selected result — confirm import */}
          {selectedResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                {selectedResult.image_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                    <Image
                      src={selectedResult.image_url}
                      alt={selectedResult.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-amber-100 shrink-0 flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-800 text-sm leading-snug">{selectedResult.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{selectedResult.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResult(null)}
                  className="text-stone-400 hover:text-stone-600 shrink-0 text-lg leading-none"
                  title="Pick a different recipe"
                >
                  ×
                </button>
              </div>

              {categoryPicker}

              {importError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
                  {importError}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleImport(selectedResult.url)}
                disabled={importing}
                className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Importing…
                  </>
                ) : (
                  '📥 Import this recipe'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── PASTE URL TAB ─── */}
      {tab === 'url' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleImport(url.trim())
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-stone-700">
              Recipe URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.bbcgoodfood.com/recipes/..."
              required
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {categoryPicker}

          {importError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
              {importError}
            </div>
          )}

          <button
            type="submit"
            disabled={importing || !url.trim()}
            className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Importing…
              </>
            ) : (
              '📥 Import Recipe'
            )}
          </button>

          <p className="text-xs text-stone-400 text-center">
            Currently supports BBC Good Food. More sites coming soon.
          </p>
        </form>
      )}
    </div>
  )
}
