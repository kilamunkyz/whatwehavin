import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toGrams } from '@/lib/nutrition/unitToGrams'
import type { RecipeIngredient, RecipeWithDetails } from '@/lib/types'

const USDA_API = 'https://api.nal.usda.gov/fdc/v1'

interface Nutrients {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * Look up a single ingredient in the USDA FoodData Central API.
 * Returns null if nothing useful is found.
 */
async function lookupNutrients(
  name: string,
  apiKey: string
): Promise<Nutrients | null> {
  // Search by ingredient name — prefer "Survey (FNDDS)" data type for
  // common foods, then Foundation Foods. Both have reliable nutrient data.
  const url = new URL(`${USDA_API}/foods/search`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', name)
  url.searchParams.set('dataType', 'Survey (FNDDS),Foundation,SR Legacy')
  url.searchParams.set('pageSize', '5')
  url.searchParams.set('nutrients', '208,203,205,204') // energy, protein, carbs, fat

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return null

  const data = await res.json()
  const foods: USDAFood[] = data.foods ?? []
  if (foods.length === 0) return null

  // Take the first result — best match
  const food = foods[0]
  const nutrients = food.foodNutrients ?? []

  const get = (nutrientId: number) => {
    const n = nutrients.find((n) => n.nutrientId === nutrientId)
    return n?.value ?? 0
  }

  return {
    calories: get(1008), // Energy (kcal) — nutrient ID 1008
    protein: get(1003),  // Protein
    carbs: get(1005),    // Carbohydrate
    fat: get(1004),      // Total fat
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Nutrition API not configured' }, { status: 500 })
  }

  // Fetch recipe + ingredients
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

  const r = recipe as RecipeWithDetails
  const ingredients: RecipeIngredient[] = r.recipe_ingredients ?? []
  const servings = r.servings || 1

  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0
  let matched = 0
  let skipped = 0

  // Process each ingredient — USDA API calls run in parallel (max 10 at once)
  const chunks = chunkArray(ingredients, 10)
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (ing) => {
        // Skip if no quantity (e.g. "to taste", "a pinch")
        if (ing.quantity === null || ing.quantity === 0) {
          skipped++
          return
        }

        const grams = toGrams(ing.quantity, ing.unit, ing.name)
        if (grams === null) {
          skipped++
          return
        }

        const nutrients = await lookupNutrients(ing.name, apiKey)
        if (!nutrients) {
          skipped++
          return
        }

        // USDA values are per 100g — scale to actual grams used
        const factor = grams / 100
        totalCalories += nutrients.calories * factor
        totalProtein += nutrients.protein * factor
        totalCarbs += nutrients.carbs * factor
        totalFat += nutrients.fat * factor
        matched++
      })
    )
  }

  const caloriesPerServing = Math.round(totalCalories / servings)
  const proteinPerServing = Math.round(totalProtein / servings)
  const carbsPerServing = Math.round(totalCarbs / servings)
  const fatPerServing = Math.round(totalFat / servings)

  // Save to recipe row
  const { error } = await supabase
    .from('recipes')
    .update({
      calories_per_serving: caloriesPerServing,
      protein_per_serving: proteinPerServing,
      carbs_per_serving: carbsPerServing,
      fat_per_serving: fatPerServing,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to save nutrition data' }, { status: 500 })
  }

  return NextResponse.json({
    calories_per_serving: caloriesPerServing,
    protein_per_serving: proteinPerServing,
    carbs_per_serving: carbsPerServing,
    fat_per_serving: fatPerServing,
    matched,
    skipped,
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Minimal USDA API types
interface USDAFood {
  fdcId: number
  description: string
  foodNutrients: { nutrientId: number; value: number }[]
}
