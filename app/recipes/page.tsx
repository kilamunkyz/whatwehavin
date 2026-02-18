import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { CategoryTabs } from '@/components/recipes/CategoryTabs'
import type { Recipe, Category } from '@/lib/types'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (category && ['starter', 'main', 'dessert'].includes(category)) {
    query = query.eq('category', category as Category)
  }

  const { data: recipes } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">My Recipes</h1>
        <div className="flex gap-2">
          <Link
            href="/recipes/import"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            + Import from URL
          </Link>
          <Link
            href="/recipes/new"
            className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            + Add manually
          </Link>
        </div>
      </div>

      <CategoryTabs active={category} />

      {!recipes || recipes.length === 0 ? (
        <div className="text-center py-20 text-stone-400 space-y-2">
          <p className="text-4xl">🍳</p>
          <p className="text-lg font-medium">No recipes yet</p>
          <p className="text-sm">Import from BBC Good Food or add one manually to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(recipes as Recipe[]).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
