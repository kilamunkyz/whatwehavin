'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [bgImage, setBgImage] = useState('')
  const [bgInput, setBgInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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

  function handleBgUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bgInput.trim()) setBgImage(bgInput.trim())
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBgImage(url)
    }
  }

  const hasAny = menu?.starter || menu?.main || menu?.dessert

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Pub Menu</h1>
        <button
          onClick={fetchMenu}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Picking…' : '🎲 Randomise'}
        </button>
      </div>

      {/* Background image controls */}
      <div className="bg-stone-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Background image (optional)
        </p>
        <div className="flex gap-2">
          <form onSubmit={handleBgUrlSubmit} className="flex flex-1 gap-2">
            <input
              value={bgInput}
              onChange={(e) => setBgInput(e.target.value)}
              placeholder="Paste image URL…"
              className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-700 text-white rounded-lg text-sm hover:bg-stone-800"
            >
              Set
            </button>
          </form>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-white transition-colors"
          >
            Upload
          </button>
          {bgImage && (
            <button
              onClick={() => setBgImage('')}
              className="px-3 py-1.5 text-red-500 text-sm hover:bg-red-50 rounded-lg"
            >
              Clear
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* The Menu Card */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-400 text-sm animate-pulse">Choosing tonight's menu…</div>
        </div>
      ) : !hasAny ? (
        <div className="text-center py-20 text-stone-400 space-y-2">
          <p className="text-4xl">🍽️</p>
          <p className="font-medium">No recipes yet</p>
          <p className="text-sm">
            Add some recipes with Starter, Main, and Dessert categories first.
          </p>
          <Link
            href="/recipes/import"
            className="inline-block mt-2 text-amber-600 hover:underline text-sm font-medium"
          >
            Import from BBC Good Food →
          </Link>
        </div>
      ) : (
        <MenuCard menu={menu!} bgImage={bgImage} />
      )}
    </div>
  )
}

function MenuCard({ menu, bgImage }: { menu: Menu; bgImage: string }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-xl"
      style={{ minHeight: 480 }}
    >
      {/* Background */}
      {bgImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 to-stone-800" />
      )}

      {/* Content */}
      <div className="relative z-10 p-10 text-center text-white font-serif space-y-8">
        {/* Restaurant name */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-300 font-sans">
            Est. Tonight
          </p>
          <h2 className="text-4xl font-bold tracking-wide">WhatWeHavin</h2>
          <div className="flex items-center gap-3 justify-center mt-2">
            <div className="h-px flex-1 bg-stone-400/50" />
            <p className="text-xs text-stone-400 uppercase tracking-widest">
              Tonight&apos;s Menu
            </p>
            <div className="h-px flex-1 bg-stone-400/50" />
          </div>
        </div>

        {/* Courses */}
        <div className="space-y-7">
          {menu.starter && (
            <MenuCourse
              label="Starter"
              recipe={menu.starter}
            />
          )}
          <div className="h-px bg-stone-400/30" />
          {menu.main && (
            <MenuCourse
              label="Main Course"
              recipe={menu.main}
            />
          )}
          <div className="h-px bg-stone-400/30" />
          {menu.dessert && (
            <MenuCourse
              label="Dessert"
              recipe={menu.dessert}
            />
          )}
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
      <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans">
        {label}
      </p>
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
