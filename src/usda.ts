// Simple USDA FoodData Central integration and heuristic classifier
// Uses FoodData Central v1 API: https://fdc.nal.usda.gov/api-guide.html
export async function classifyWithUSDA(query: string) {
  const apiKey = localStorage.getItem('usda_api_key')
  if (!apiKey) throw new Error('USDA API key not set. Please set it in settings (usda_api_key in localStorage).')

  // Search for the food
  const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`
  const body = { generalSearchInput: query, pageSize: 3 }
  const res = await fetch(searchUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`USDA search failed: ${res.status} ${t}`)
  }
  const data = await res.json()
  const foods = data?.foods || []
  if (!foods.length) return `No USDA data found for "${query}".`

  // Pick the first result
  const f = foods[0]
  // Gather nutrients into a map by name (lowercased)
  const nutrients: Record<string, number> = {}
  for (const n of f.foodNutrients || []) {
    const name = (n.nutrientName || n.nutrient?.name || '').toString().toLowerCase()
    const amount = Number(n.value ?? n.amount ?? 0)
    if (!name) continue
    nutrients[name] = amount
  }

  // Helpful aliases
  const kcal = nutrients['energy'] || nutrients['energy (kcal)'] || nutrients['calories'] || nutrients['energy (kcal)'] || 0
  const protein = nutrients['protein'] || 0
  const totalFat = nutrients['total lipid (fat)'] || nutrients['total fat'] || 0
  const satFat = nutrients['fatty acids, total saturated'] || nutrients['saturated fat'] || 0
  const carbs = nutrients['carbohydrate, by difference'] || nutrients['carbohydrates'] || 0
  const sugar = nutrients['sugars, total including nleA'] || nutrients['sugars'] || nutrients['sugar'] || 0
  const fiber = nutrients['fiber, total dietary'] || nutrients['dietary fiber'] || 0
  const sodium = nutrients['sodium, na'] || nutrients['sodium'] || 0

  // Heuristic classification (per 100g where USDA returns per 100g or per serving)
  // Thresholds are intentionally simple for a demo.
  let classification: 'beneficial' | 'avoid' | 'neutral' = 'neutral'
  const reasons: string[] = []

  if ((sugar && sugar > 15) || (satFat && satFat > 5) || (sodium && sodium > 600)) {
    classification = 'avoid'
    if (sugar && sugar > 15) reasons.push(`High sugar (${sugar} g)`)
    if (satFat && satFat > 5) reasons.push(`High saturated fat (${satFat} g)`)
    if (sodium && sodium > 600) reasons.push(`High sodium (${sodium} mg)`)
  } else if ((protein && protein >= 5 && fiber && fiber >= 3 && (sugar === 0 || sugar <= 5)) || (protein && protein >= 8)) {
    classification = 'beneficial'
    if (protein) reasons.push(`Protein ${protein} g`)
    if (fiber) reasons.push(`Fiber ${fiber} g`)
    if (sugar !== undefined) reasons.push(`Sugar ${sugar} g`)
  } else {
    classification = 'neutral'
    if (kcal) reasons.push(`Calories ${kcal}`)
  }

  const summary = []
  if (kcal) summary.push(`Calories: ${kcal}`)
  if (protein) summary.push(`Protein: ${protein} g`)
  if (totalFat) summary.push(`Fat: ${totalFat} g`)
  if (satFat) summary.push(`Sat fat: ${satFat} g`)
  if (carbs) summary.push(`Carbs: ${carbs} g`)
  if (sugar) summary.push(`Sugar: ${sugar} g`)
  if (fiber) summary.push(`Fiber: ${fiber} g`)
  if (sodium) summary.push(`Sodium: ${sodium} mg`)

  const explanation = `USDA match: ${f.description || f.foodName || f.dataType || 'food'}\nClassification: ${classification.toUpperCase()}\nReasons: ${reasons.join('; ') || 'None'}\nSummary: ${summary.join(', ')}`
  return explanation
}
