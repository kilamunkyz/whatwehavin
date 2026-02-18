import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import type { RecipeWithDetails } from '@/lib/types'

export default async function EditRecipePage({
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
    .select(`*, recipe_ingredients(*), recipe_steps(*)`)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!recipe) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
          <Link href="/recipes" className="hover:text-stone-700">Recipes</Link>
          <span>/</span>
          <Link href={`/recipes/${id}`} className="hover:text-stone-700">{recipe.title}</Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Edit Recipe</h1>
      </div>
      <RecipeForm recipe={recipe as RecipeWithDetails} />
    </div>
  )
}
