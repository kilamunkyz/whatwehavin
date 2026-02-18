export interface IngredientEntry {
  name: string
  quantity: number | null
  unit: string | null
}

const UNIT_ALIASES: Record<string, string> = {
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  millilitre: 'ml',
  millilitres: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  dessertspoon: 'dsp',
  dessertspoons: 'dsp',
  pints: 'pint',
  cans: 'can',
  tins: 'tin',
  packs: 'pack',
  packets: 'pack',
  packet: 'pack',
  bunches: 'bunch',
  handfuls: 'handful',
  sprigs: 'sprig',
  cloves: 'clove',
  rashers: 'rasher',
  slices: 'slice',
  sheets: 'sheet',
  sticks: 'stick',
}

function normaliseUnit(unit: string | null): string | null {
  if (!unit) return null
  const lower = unit.toLowerCase().trim()
  return UNIT_ALIASES[lower] ?? lower
}

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(a |an |some |the )/i, '')
    .replace(/s$/, '') // naive deplural — good enough for personal use
}

export function consolidateIngredients(items: IngredientEntry[]): IngredientEntry[] {
  const map = new Map<string, IngredientEntry>()

  for (const item of items) {
    const name = normaliseName(item.name)
    const unit = normaliseUnit(item.unit)
    const key = `${name}::${unit ?? ''}`

    const existing = map.get(key)
    if (!existing) {
      map.set(key, { name, quantity: item.quantity, unit })
    } else {
      if (existing.quantity !== null && item.quantity !== null) {
        existing.quantity = parseFloat(
          (existing.quantity + item.quantity).toFixed(3)
        )
      }
      // If either is null ("to taste"), keep as-is
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/** Format a quantity + unit for display */
export function formatQuantity(
  quantity: number | null,
  unit: string | null
): string {
  if (quantity === null) return ''
  const q =
    quantity % 1 === 0
      ? String(quantity)
      : quantity.toFixed(1).replace(/\.0$/, '')
  return unit ? `${q} ${unit}` : q
}
