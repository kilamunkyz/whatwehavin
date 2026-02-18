import Link from 'next/link'
import { RecipeForm } from '@/components/recipes/RecipeForm'

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
          <Link href="/recipes" className="hover:text-stone-700">Recipes</Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Add a Recipe</h1>
      </div>
      <RecipeForm />
    </div>
  )
}
