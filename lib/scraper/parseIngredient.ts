export interface ParsedIngredient {
  quantity: number | null
  unit: string | null
  name: string
  notes: string | null
}

const UNITS = [
  // weight
  'kg', 'g', 'oz', 'lb', 'lbs',
  // volume
  'litre', 'litres', 'liter', 'liters', 'l',
  'ml', 'millilitre', 'millilitres',
  'pint', 'pints', 'fl oz',
  // spoons
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'dessertspoon', 'dessertspoons',
  // cups
  'cup', 'cups',
  // loose
  'bunch', 'bunches',
  'handful', 'handfuls',
  'can', 'cans',
  'tin', 'tins',
  'jar', 'jars',
  'pack', 'packs', 'packet', 'packets',
  'sheet', 'sheets',
  'slice', 'slices',
  'sprig', 'sprigs',
  'clove', 'cloves',
  'pinch', 'pinches',
  'dash', 'dashes',
  'drop', 'drops',
  'stick', 'sticks',
  'rasher', 'rashers',
]

// Sort by length descending so we match 'tbsp' before 'tsp', 'litres' before 'l', etc.
const UNITS_SORTED = [...UNITS].sort((a, b) => b.length - a.length)

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
}

function normaliseUnicode(str: string): string {
  let result = str
  for (const [char, val] of Object.entries(UNICODE_FRACTIONS)) {
    result = result.replace(new RegExp(char, 'g'), ` ${val}`)
  }
  return result
}

function parseNumber(str: string): number | null {
  str = str.trim()
  if (!str) return null

  // Handle "1 1/2" or "1½" type patterns (already normalised to "1 0.5")
  const parts = str.split(/\s+/).filter(Boolean)
  if (parts.length === 2) {
    const a = parseFloat(parts[0])
    const b = parseFloat(parts[1])
    if (!isNaN(a) && !isNaN(b)) return a + b
  }

  // Handle "3/4" fraction
  if (/^\d+\/\d+$/.test(str)) {
    const [n, d] = str.split('/').map(Number)
    return d !== 0 ? n / d : null
  }

  const n = parseFloat(str)
  return isNaN(n) ? null : n
}

export function parseIngredient(raw: string): ParsedIngredient {
  // Normalise unicode fractions
  let str = normaliseUnicode(raw).trim()

  // Extract leading number (may include fraction, mixed number, range like "2-3")
  // Take only the first number of a range
  str = str.replace(/^(\d[\d\s./]*)\s*[-–]\s*\d[\d\s./]*/, '$1')

  const numRegex = /^([\d\s./]+)/
  const numMatch = str.match(numRegex)
  let quantity: number | null = null
  let rest = str

  if (numMatch) {
    quantity = parseNumber(numMatch[1])
    rest = str.slice(numMatch[0].length).trim()
  }

  // Try to match a unit at the start of the remaining string
  let unit: string | null = null
  for (const u of UNITS_SORTED) {
    const uRegex = new RegExp(`^${u}s?\\b`, 'i')
    if (uRegex.test(rest)) {
      unit = u.toLowerCase()
      rest = rest.replace(uRegex, '').trim()
      break
    }
  }

  // Strip leading "of " after unit (e.g. "100ml of milk")
  rest = rest.replace(/^of\s+/i, '')

  // Split name and notes at first comma
  const commaIdx = rest.indexOf(',')
  let name: string
  let notes: string | null = null

  if (commaIdx !== -1) {
    name = rest.slice(0, commaIdx).trim()
    notes = rest.slice(commaIdx + 1).trim() || null
  } else {
    name = rest.trim()
  }

  // If we couldn't extract anything useful, just return the whole string as the name
  if (!name) {
    return { quantity: null, unit: null, name: raw.trim(), notes: null }
  }

  return { quantity, unit, name, notes }
}
