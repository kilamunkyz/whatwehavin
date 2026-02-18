import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  starter: 'Starter',
  main: 'Main',
  dessert: 'Dessert',
}

const CATEGORY_COLORS: Record<string, string> = {
  starter: 'bg-green-100 text-green-700',
  main: 'bg-amber-100 text-amber-700',
  dessert: 'bg-pink-100 text-pink-700',
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all">
        <div className="relative h-40 bg-stone-100">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-stone-300">
              🍽️
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-stone-800 text-sm leading-snug line-clamp-2">
              {recipe.title}
            </h3>
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[recipe.category]}`}
            >
              {CATEGORY_LABELS[recipe.category]}
            </span>
          </div>
          <p className="text-xs text-stone-500">Serves {recipe.servings}</p>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
