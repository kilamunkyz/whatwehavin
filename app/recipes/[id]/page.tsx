import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ScalingView } from '@/components/recipes/ScalingView'
import type { RecipeWithDetails } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  starter: 'Starter',
  main: 'Main',
  dessert: 'Dessert',
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: recipe } = await supabase
    .from('recipes')
    .select(
      `*, recipe_ingredients(*), recipe_steps(*)`
    )
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!recipe) notFound()

  const r = recipe as RecipeWithDetails
  const ingredients = [...r.recipe_ingredients].sort((a, b) => a.sort_order - b.sort_order)
  const steps = [...r.recipe_steps].sort((a, b) => a.step_number - b.step_number)

  const initialNutrition =
    r.calories_per_serving !== null
      ? {
          calories_per_serving: r.calories_per_serving!,
          protein_per_serving: r.protein_per_serving!,
          carbs_per_serving: r.carbs_per_serving!,
          fat_per_serving: r.fat_per_serving!,
        }
      : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Link href="/recipes" className="hover:text-stone-700">Recipes</Link>
            <span>/</span>
            <span>{CATEGORY_LABELS[r.category]}</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">{r.title}</h1>
          {r.source_url && (
            <a
              href={r.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 hover:underline"
            >
              View original recipe ↗
            </a>
          )}
        </div>
        <Link
          href={`/recipes/${id}/edit`}
          className="shrink-0 text-sm px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Edit
        </Link>
      </div>

      {/* Image */}
      {r.image_url && (
        <div className="relative h-64 rounded-xl overflow-hidden">
          <Image
            src={r.image_url}
            alt={r.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Description */}
      {r.description && (
        <p className="text-stone-600 text-base leading-relaxed">{r.description}</p>
      )}

      {/* Tags */}
      {r.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients with scaling + nutrition */}
      <ScalingView
        recipeId={id}
        defaultServings={r.servings}
        ingredients={ingredients}
        steps={steps}
        initialNutrition={initialNutrition}
      />
    </div>
  )
}
