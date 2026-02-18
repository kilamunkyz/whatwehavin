import { ImportForm } from '@/components/recipes/ImportForm'
import Link from 'next/link'

export default function ImportPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
          <Link href="/recipes" className="hover:text-stone-700">Recipes</Link>
          <span>/</span>
          <span>Import</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Import a Recipe</h1>
        <p className="text-stone-500 mt-1 text-sm">Paste a BBC Good Food URL and we'll fetch all the details automatically.</p>
      </div>
      <ImportForm />
    </div>
  )
}
