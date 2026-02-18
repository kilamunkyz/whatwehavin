'use client'

import { useState } from 'react'
import { formatQuantity } from '@/lib/shopping/consolidate'
import type { ShoppingListItem, MealPlanWeek } from '@/lib/types'

interface Props {
  week: MealPlanWeek
  initialItems: ShoppingListItem[]
}

export function ShoppingClient({ week, initialItems }: Props) {
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems)
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const autoItems = items.filter((i) => !i.is_manual)
  const manualItems = items.filter((i) => i.is_manual)
  const checkedCount = items.filter((i) => i.checked).length

  async function handleRegenerate() {
    setGenerating(true)
    const res = await fetch('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_id: week.id }),
    })
    if (res.ok) {
      const { items: newItems } = await res.json()
      setItems(newItems)
    }
    setGenerating(false)
  }

  async function handleClear() {
    if (!confirm('Clear the entire shopping list?')) return
    setClearing(true)
    const res = await fetch(`/api/shopping-list?week_id=${week.id}`, {
      method: 'DELETE',
    })
    if (res.ok) setItems([])
    setClearing(false)
  }

  async function handleToggle(item: ShoppingListItem) {
    const updated = { ...item, checked: !item.checked }
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
    await fetch(`/api/shopping-list/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: updated.checked }),
    })
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/shopping-list/${id}`, { method: 'DELETE' })
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    setAddingItem(true)

    const res = await fetch('/api/shopping-list/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_id: week.id, ingredient_name: newItem.trim() }),
    })

    if (res.ok) {
      const { item } = await res.json()
      setItems((prev) => [...prev, item])
      setNewItem('')
    }
    setAddingItem(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Shopping List</h1>
          <p className="text-sm text-stone-400">
            {checkedCount}/{items.length} items ticked off
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : (
              '↻ Generate from plan'
            )}
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-4 py-2 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {clearing ? 'Clearing…' : '🗑 Clear list'}
            </button>
          )}
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-stone-400 space-y-2">
          <p className="text-3xl">🛒</p>
          <p className="font-medium">List is empty</p>
          <p className="text-sm">Add meals to your planner then click "Generate from plan"</p>
        </div>
      )}

      {/* Auto-generated items */}
      {autoItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            From meal plan
          </h2>
          <ul className="space-y-1">
            {autoItems.map((item) => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Manual items */}
      {manualItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Added manually
          </h2>
          <ul className="space-y-1">
            {manualItems.map((item) => (
              <ShoppingItem
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Add manual item */}
      <form onSubmit={handleAddManual} className="flex gap-2 pt-2 border-t border-stone-200">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item manually…"
          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={addingItem || !newItem.trim()}
          className="px-4 py-2 bg-stone-700 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}

function ShoppingItem({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem
  onToggle: () => void
  onDelete: () => void
}) {
  const qtyDisplay = formatQuantity(item.quantity, item.unit)

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-stone-100 group">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-stone-300 hover:border-amber-400'
        }`}
      >
        {item.checked && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm capitalize ${
          item.checked ? 'line-through text-stone-400' : 'text-stone-700'
        }`}
      >
        {item.ingredient_name}
        {qtyDisplay && (
          <span className="ml-1.5 text-stone-400 text-xs">({qtyDisplay})</span>
        )}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all text-lg leading-none"
      >
        ×
      </button>
    </li>
  )
}
