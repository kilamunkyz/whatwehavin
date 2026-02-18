'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, RecipeWithDetails } from '@/lib/types'
import { TAGS } from '@/lib/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
]

interface IngredientRow {
  quantity: string
  unit: string
  name: string
  notes: string
}

interface StepRow {
  instruction: string
}

interface Props {
  recipe?: RecipeWithDetails
}

export function RecipeForm({ recipe }: Props) {
  const router = useRouter()
  const isEdit = !!recipe

  const [title, setTitle] = useState(recipe?.title ?? '')
  const [description, setDescription] = useState(recipe?.description ?? '')
  const [servings, setServings] = useState(recipe?.servings ?? 2)
  const [imageUrl, setImageUrl] = useState(recipe?.image_url ?? '')
  const [category, setCategory] = useState<Category>(recipe?.category ?? 'main')
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? [])

  const sortedIngredients = recipe
    ? [...recipe.recipe_ingredients].sort((a, b) => a.sort_order - b.sort_order)
    : []
  const sortedSteps = recipe
    ? [...recipe.recipe_steps].sort((a, b) => a.step_number - b.step_number)
    : []

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    sortedIngredients.length > 0
      ? sortedIngredients.map((i) => ({
          quantity: i.quantity !== null ? String(i.quantity) : '',
          unit: i.unit ?? '',
          name: i.name,
          notes: i.notes ?? '',
        }))
      : [{ quantity: '', unit: '', name: '', notes: '' }]
  )

  const [steps, setSteps] = useState<StepRow[]>(
    sortedSteps.length > 0
      ? sortedSteps.map((s) => ({ instruction: s.instruction }))
      : [{ instruction: '' }]
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function updateIngredient(i: number, field: keyof IngredientRow, val: string) {
    setIngredients((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: val } : row))
    )
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { quantity: '', unit: '', name: '', notes: '' }])
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, val: string) {
    setSteps((prev) =>
      prev.map((row, idx) => (idx === i ? { instruction: val } : row))
    )
  }

  function addStep() {
    setSteps((prev) => [...prev, { instruction: '' }])
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const body = {
      title,
      description: description || null,
      servings,
      image_url: imageUrl || null,
      category,
      tags,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i, idx) => ({
          quantity: i.quantity ? parseFloat(i.quantity) : null,
          unit: i.unit || null,
          name: i.name.trim(),
          notes: i.notes || null,
          sort_order: idx,
        })),
      steps: steps
        .filter((s) => s.instruction.trim())
        .map((s, idx) => ({
          step_number: idx + 1,
          instruction: s.instruction.trim(),
        })),
    }

    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/recipes/${recipe!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save recipe')
        return
      }

      router.push(`/recipes/${data.recipe.id}`)
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!recipe || !confirm('Delete this recipe? This cannot be undone.')) return
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
    router.push('/recipes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Basic fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Recipe name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            placeholder="A short description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Serves</label>
            <input
              type="number"
              min={1}
              max={100}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 2)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Category *</label>
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

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  tags.includes(tag)
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <h3 className="font-semibold text-stone-800">Ingredients</h3>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                placeholder="Qty"
                className="w-16 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <input
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                placeholder="Unit"
                className="w-20 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                placeholder="Ingredient *"
                className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <input
                value={ing.notes}
                onChange={(e) => updateIngredient(i, 'notes', e.target.value)}
                placeholder="Notes"
                className="w-28 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="text-stone-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          + Add ingredient
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h3 className="font-semibold text-stone-800">Method</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="mt-2 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Step ${i + 1}`}
                rows={2}
                className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="mt-2 text-stone-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          + Add step
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Recipe'}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
