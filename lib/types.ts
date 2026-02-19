export type Category = 'starter' | 'main' | 'dessert'
export type MealType = 'breakfast' | 'lunch' | 'dinner'

export const CATEGORIES: Category[] = ['starter', 'main', 'dessert']
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export const TAGS = [
  'sandwich',
  'chinese',
  'italian',
  'curry',
  'thai',
  'fish',
  'chicken',
  'beef',
  'pork',
  'lamb',
  'vegetarian',
  'vegan',
  'soup',
  'salad',
  'pasta',
  'mexican',
  'japanese',
  'indian',
  'pub',
  'quick',
  'slow-cook',
] as const

export type Tag = typeof TAGS[number]

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  servings: number
  image_url: string | null
  source_url: string | null
  category: Category
  tags: string[]
  calories_per_serving: number | null
  protein_per_serving: number | null
  carbs_per_serving: number | null
  fat_per_serving: number | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  quantity: number | null
  unit: string | null
  name: string
  notes: string | null
  sort_order: number
}

export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
}

export interface RecipeWithDetails extends Recipe {
  recipe_ingredients: RecipeIngredient[]
  recipe_steps: RecipeStep[]
}

export interface MealPlanWeek {
  id: string
  user_id: string
  week_start_date: string
}

export interface MealPlanSlot {
  id: string
  week_id: string
  day_of_week: number // 0=Mon, 6=Sun
  meal_type: MealType
  recipe_id: string | null
  free_text: string | null
  servings: number | null
  recipe?: Pick<Recipe, 'id' | 'title' | 'image_url' | 'category' | 'servings'>
}

export interface ShoppingListItem {
  id: string
  user_id: string
  week_id: string | null
  ingredient_name: string
  quantity: number | null
  unit: string | null
  checked: boolean
  is_manual: boolean
  created_at: string
}

// For the scraper return value before saving to DB
export interface ScrapedIngredient {
  quantity: number | null
  unit: string | null
  name: string
  notes: string | null
  sort_order: number
}

export interface ScrapedRecipe {
  title: string
  description: string | null
  servings: number
  image_url: string | null
  source_url: string
  category: Category | null
  ingredients: ScrapedIngredient[]
  steps: Array<{ step_number: number; instruction: string }>
}
