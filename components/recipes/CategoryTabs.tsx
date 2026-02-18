'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'All', value: undefined },
  { label: 'Starters', value: 'starter' },
  { label: 'Mains', value: 'main' },
  { label: 'Desserts', value: 'dessert' },
]

export function CategoryTabs({ active }: { active?: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-stone-100 p-1 rounded-lg w-fit">
      {tabs.map((tab) => {
        const isActive = active === tab.value || (!active && !tab.value)
        const href = tab.value ? `${pathname}?category=${tab.value}` : pathname
        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
