'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MenuRecipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  category: string
}

interface Menu {
  starter: MenuRecipe | null
  main: MenuRecipe | null
  dessert: MenuRecipe | null
}

export function PubMenuClient() {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchMenu() {
    setLoading(true)
    const res = await fetch('/api/pub-menu')
    if (res.ok) {
      const data = await res.json()
      setMenu(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  const hasAny = menu?.starter || menu?.main || menu?.dessert

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-800">Menu Generator</h1>
        <p className="text-stone-500">Stuck for ideas? Give this a whirl.</p>
      </div>

      {/* Randomise button */}
      <button
        onClick={fetchMenu}
        disabled={loading}
        className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Picking…
          </>
        ) : (
          '🎲 Randomise'
        )}
      </button>

      {/* Menu card */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400 text-sm animate-pulse">Choosing tonight&apos;s menu…</div>
        </div>
      ) : !hasAny ? (
        <div className="text-center py-20 text-stone-400 space-y-2">
          <p className="text-4xl">🍽️</p>
          <p className="font-medium">No recipes yet</p>
          <p className="text-sm">
            Add recipes with Starter, Main, and Dessert categories first.
          </p>
          <Link
            href="/recipes/import"
            className="inline-block mt-2 text-amber-600 hover:underline text-sm font-medium"
          >
            Import from BBC Good Food →
          </Link>
        </div>
      ) : (
        <MenuCard menu={menu!} />
      )}
    </div>
  )
}

function MenuCard({ menu }: { menu: Menu }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900 to-stone-800" />
      <div className="relative z-10 p-8 sm:p-10 text-center text-white font-serif space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-300 font-sans">Est. Tonight</p>
          <h2 className="text-4xl font-bold tracking-wide">WhatWeHavin</h2>
          <div className="flex items-center gap-3 justify-center mt-2">
            <div className="h-px flex-1 bg-stone-400/50" />
            <p className="text-xs text-stone-400 uppercase tracking-widest font-sans">Tonight&apos;s Menu</p>
            <div className="h-px flex-1 bg-stone-400/50" />
          </div>
        </div>

        {/* Courses */}
        <div className="space-y-7">
          {menu.starter && <MenuCourse label="Starter" recipe={menu.starter} />}
          <div className="h-px bg-stone-400/30" />
          {menu.main && <MenuCourse label="Main Course" recipe={menu.main} />}
          <div className="h-px bg-stone-400/30" />
          {menu.dessert && <MenuCourse label="Dessert" recipe={menu.dessert} />}
        </div>

        <p className="text-xs text-stone-400 pt-2 font-sans">
          All dishes subject to the chef&apos;s whim
        </p>
      </div>
    </div>
  )
}

function MenuCourse({ label, recipe }: { label: string; recipe: MenuRecipe }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans">{label}</p>
      <Link href={`/recipes/${recipe.id}`} className="hover:underline decoration-stone-400">
        <h3 className="text-2xl font-semibold leading-snug">{recipe.title}</h3>
      </Link>
      {recipe.description && (
        <p className="text-sm text-stone-300 leading-relaxed max-w-sm mx-auto">
          {recipe.description.length > 100
            ? recipe.description.slice(0, 100) + '…'
            : recipe.description}
        </p>
      )}
    </div>
  )
}
