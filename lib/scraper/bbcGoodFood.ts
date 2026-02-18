import * as cheerio from 'cheerio'
import { parseIngredient } from './parseIngredient'
import type { ScrapedRecipe } from '@/lib/types'

export async function scrapeBBCGoodFood(url: string): Promise<ScrapedRecipe> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch page: HTTP ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // --- Strategy 1: JSON-LD structured data ---
  let jsonLd: Record<string, unknown> | null = null

  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLd) return
    try {
      const text = $(el).html() || ''
      const parsed = JSON.parse(text)
      // Can be a single object or a @graph array
      const candidates: unknown[] = parsed['@graph']
        ? parsed['@graph']
        : [parsed]
      const recipe = candidates.find(
        (n): n is Record<string, unknown> =>
          typeof n === 'object' &&
          n !== null &&
          (n as Record<string, unknown>)['@type'] === 'Recipe'
      )
      if (recipe) jsonLd = recipe
    } catch {
      // ignore malformed JSON-LD blocks
    }
  })

  if (jsonLd) {
    return extractFromJsonLd(jsonLd, url)
  }

  // --- Strategy 2: CSS selector fallback ---
  return extractFromCss($, url)
}

function extractFromJsonLd(
  data: Record<string, unknown>,
  url: string
): ScrapedRecipe {
  const rawIngredients: string[] = Array.isArray(data.recipeIngredient)
    ? (data.recipeIngredient as string[])
    : []

  const rawSteps: unknown[] = Array.isArray(data.recipeInstructions)
    ? data.recipeInstructions
    : []

  const ingredients = rawIngredients.map((raw, i) => ({
    ...parseIngredient(raw),
    sort_order: i,
  }))

  const steps = rawSteps.map((step, i) => ({
    step_number: i + 1,
    instruction:
      typeof step === 'string'
        ? step
        : (step as Record<string, unknown>).text
        ? String((step as Record<string, unknown>).text)
        : '',
  }))

  // recipeYield can be "Serves 4", "4", ["4 servings"]
  const yieldRaw = Array.isArray(data.recipeYield)
    ? String(data.recipeYield[0])
    : data.recipeYield
    ? String(data.recipeYield)
    : '2'
  const servings = parseInt(yieldRaw.replace(/\D/g, ''), 10) || 2

  // image can be string, object with url, or array
  let imageUrl: string | null = null
  if (Array.isArray(data.image)) {
    const first = data.image[0]
    imageUrl =
      typeof first === 'string'
        ? first
        : typeof first === 'object' && first !== null
        ? String((first as Record<string, unknown>).url ?? '')
        : null
  } else if (typeof data.image === 'string') {
    imageUrl = data.image
  } else if (
    typeof data.image === 'object' &&
    data.image !== null
  ) {
    imageUrl = String((data.image as Record<string, unknown>).url ?? '')
  }

  return {
    title: String(data.name ?? 'Untitled'),
    description: data.description ? String(data.description) : null,
    servings,
    image_url: imageUrl || null,
    source_url: url,
    category: null, // user selects on import
    ingredients,
    steps,
  }
}

function extractFromCss(
  $: ReturnType<typeof cheerio.load>,
  url: string
): ScrapedRecipe {
  const title =
    $('h1').first().text().trim() ||
    $('[class*="heading"]').first().text().trim() ||
    'Untitled'

  const description =
    $('[class*="description"], [class*="recipe__intro"]').first().text().trim() ||
    null

  // Try multiple selectors for ingredients
  const ingredientSelectors = [
    '[class*="ingredient"] li',
    '[class*="Ingredient"] li',
    '.ingredients-list li',
    '[data-ingredient]',
  ]
  let ingredientEls = $('')
  for (const sel of ingredientSelectors) {
    const found = $(sel)
    if (found.length > 0) {
      ingredientEls = found
      break
    }
  }

  const ingredients = ingredientEls
    .toArray()
    .map((el, i) => ({
      ...parseIngredient($(el).text().trim()),
      sort_order: i,
    }))
    .filter((ing) => ing.name.length > 0)

  // Steps
  const stepSelectors = [
    '[class*="method"] li',
    '[class*="Method"] li',
    '[class*="step"] p',
    '.method-steps li',
  ]
  let stepEls = $('')
  for (const sel of stepSelectors) {
    const found = $(sel)
    if (found.length > 0) {
      stepEls = found
      break
    }
  }

  const steps = stepEls
    .toArray()
    .map((el, i) => ({
      step_number: i + 1,
      instruction: $(el).text().trim(),
    }))
    .filter((s) => s.instruction.length > 0)

  // Servings
  const servingsText = $('[class*="serving"], [class*="yield"]').first().text()
  const servings = parseInt(servingsText.replace(/\D/g, ''), 10) || 2

  // Image
  const image_url =
    $('img[class*="recipe"], img[class*="Recipe"]').first().attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    null

  return {
    title,
    description,
    servings,
    image_url: image_url || null,
    source_url: url,
    category: null,
    ingredients,
    steps,
  }
}
