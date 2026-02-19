/**
 * Convert a quantity + unit to grams.
 * Returns null if the unit is unrecognisable (e.g. "pinch", "to taste").
 *
 * Densities are rough averages — good enough for calorie estimates.
 */

// Grams per 1 unit
const UNIT_GRAMS: Record<string, number> = {
  // Weight
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.59,
  pound: 453.59,
  pounds: 453.59,

  // Volume (using water density as fallback, 1ml ≈ 1g)
  ml: 1,
  millilitre: 1,
  millilitres: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  litre: 1000,
  litres: 1000,
  liter: 1000,
  liters: 1000,

  // Tablespoon / teaspoon (≈15ml / 5ml → ~15g / 5g for water-like liquids)
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,

  // Cup (UK/US ≈ 240ml)
  cup: 240,
  cups: 240,

  // Fl oz
  'fl oz': 28.41,
  'fluid ounce': 28.41,
  'fluid ounces': 28.41,
}

/**
 * Common ingredient densities (g per ml) to improve accuracy
 * for volume-measured ingredients.
 */
const INGREDIENT_DENSITY: Array<{ pattern: RegExp; gPerMl: number }> = [
  { pattern: /\boil\b/, gPerMl: 0.91 },
  { pattern: /\bbutter\b/, gPerMl: 0.91 },
  { pattern: /\bhoney\b/, gPerMl: 1.42 },
  { pattern: /\bsugar\b/, gPerMl: 0.85 },
  { pattern: /\bflour\b/, gPerMl: 0.53 },
  { pattern: /\bsalt\b/, gPerMl: 1.2 },
  { pattern: /\bmilk\b/, gPerMl: 1.03 },
  { pattern: /\bcream\b/, gPerMl: 1.0 },
  { pattern: /\bstock\b|\bbroth\b/, gPerMl: 1.0 },
  { pattern: /\bwine\b/, gPerMl: 0.99 },
  { pattern: /\bvinegar\b/, gPerMl: 1.01 },
  { pattern: /\bcocoa\b/, gPerMl: 0.5 },
]

/**
 * Typical weights for whole/count items (grams each).
 * Used when unit is null or a count word.
 */
const COUNT_WEIGHT: Array<{ pattern: RegExp; grams: number }> = [
  { pattern: /\begg(s)?\b/, grams: 55 },
  { pattern: /\bonion(s)?\b/, grams: 150 },
  { pattern: /\bclove(s)? of garlic\b|\bgarlic clove(s)?\b/, grams: 5 },
  { pattern: /\bcarrot(s)?\b/, grams: 80 },
  { pattern: /\btomato(es)?\b/, grams: 120 },
  { pattern: /\bpotato(es)?\b/, grams: 170 },
  { pattern: /\bchicken breast(s)?\b/, grams: 175 },
  { pattern: /\bchicken thigh(s)?\b/, grams: 120 },
  { pattern: /\blemon(s)?\b/, grams: 100 },
  { pattern: /\blime(s)?\b/, grams: 70 },
  { pattern: /\bcourgette(s)?\b|\bzucchini(s)?\b/, grams: 200 },
  { pattern: /\bpepper(s)?\b|\bcapsicum(s)?\b/, grams: 160 },
  { pattern: /\bstick(s)? of celery\b|\bcelery stick(s)?\b/, grams: 40 },
  { pattern: /\bshallot(s)?\b/, grams: 30 },
  { pattern: /\bbayleaf\b|\bbay leaf\b|\bbay leaves\b/, grams: 1 },
]

/**
 * Convert quantity + unit + ingredientName to grams.
 * Returns null if it can't make a sensible estimate.
 */
export function toGrams(
  quantity: number,
  unit: string | null,
  ingredientName: string
): number | null {
  const name = ingredientName.toLowerCase()
  const u = (unit ?? '').toLowerCase().trim()

  // 1. Direct unit match
  if (u && UNIT_GRAMS[u] !== undefined) {
    const gramsPerUnit = UNIT_GRAMS[u]
    // For volume units, apply density if we know it
    const isVolumeUnit = isVolume(u)
    if (isVolumeUnit) {
      for (const { pattern, gPerMl } of INGREDIENT_DENSITY) {
        if (pattern.test(name)) {
          return quantity * gramsPerUnit * gPerMl
        }
      }
    }
    return quantity * gramsPerUnit
  }

  // 2. No unit — try count items
  if (!u || u === 'whole' || u === 'large' || u === 'medium' || u === 'small' || u === 'piece' || u === 'pieces' || u === 'slice' || u === 'slices') {
    for (const { pattern, grams } of COUNT_WEIGHT) {
      if (pattern.test(name)) {
        return quantity * grams
      }
    }
    // Unknown count item — assume 100g each as rough default
    return quantity * 100
  }

  // 3. Can't convert — skip (pinch, handful, bunch, sprig, etc.)
  return null
}

function isVolume(unit: string): boolean {
  return [
    'ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters',
    'l', 'litre', 'litres', 'liter', 'liters',
    'tbsp', 'tablespoon', 'tablespoons',
    'tsp', 'teaspoon', 'teaspoons',
    'cup', 'cups', 'fl oz', 'fluid ounce', 'fluid ounces',
  ].includes(unit)
}
