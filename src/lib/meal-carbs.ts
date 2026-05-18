import type { CarbConfidence, MealComponent, MealEntry } from "@/lib/types"

export function mealCarbsMidpoint(meal: Pick<MealEntry, "carbsGrams" | "carbsMinGrams" | "carbsMaxGrams">): number | undefined {
  if (meal.carbsMinGrams != null && meal.carbsMaxGrams != null) {
    return Math.round((meal.carbsMinGrams + meal.carbsMaxGrams) / 2)
  }
  return meal.carbsGrams
}

/** Value used in sums (insights, day totals). */
export function mealCarbsForSum(meal: MealEntry): number {
  if (meal.userCorrectedKh != null) return meal.userCorrectedKh
  return mealCarbsMidpoint(meal) ?? 0
}

export function formatCarbsGrams(grams: number, locale: "de" | "en" = "de"): string {
  const n = grams % 1 === 0 ? String(Math.round(grams)) : grams.toFixed(1)
  return locale === "en" ? `${n} g carbs` : `${n} g KH`
}

export function formatMealCarbsLabel(
  meal: MealEntry,
  locale: "de" | "en" = "de"
): string | null {
  if (meal.userCorrectedKh != null) {
    return formatCarbsGrams(meal.userCorrectedKh, locale)
  }
  const min = meal.carbsMinGrams
  const max = meal.carbsMaxGrams
  if (min != null && max != null) {
    const a = min % 1 === 0 ? Math.round(min) : min
    const b = max % 1 === 0 ? Math.round(max) : max
    if (a === b) return formatCarbsGrams(a, locale)
    return locale === "en" ? `${a}–${b} g carbs` : `${a}–${b} g KH`
  }
  if (meal.carbsGrams != null && meal.carbsGrams > 0) {
    return formatCarbsGrams(meal.carbsGrams, locale)
  }
  return null
}

export function confidenceBadgeClass(confidence?: CarbConfidence): string {
  switch (confidence) {
    case "high":
      return "border-emerald-200 bg-emerald-50 text-emerald-800"
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-900"
    case "low":
      return "border-slate-200 bg-slate-100 text-slate-600"
    default:
      return "border-slate-200 bg-slate-50 text-slate-500"
  }
}

export function confidenceLabelKey(confidence?: CarbConfidence): string {
  switch (confidence) {
    case "high":
      return "logbook.confidenceHigh"
    case "medium":
      return "logbook.confidenceMedium"
    case "low":
      return "logbook.confidenceLow"
    default:
      return "logbook.confidenceUnknown"
  }
}

export function hasAiMealEstimate(meal: MealEntry): boolean {
  return (
    meal.carbsConfidence != null ||
    meal.carbsMinGrams != null ||
    meal.components != null ||
    meal.extractionNote != null
  )
}

export function normalizeComponents(raw: unknown): MealComponent[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: MealComponent[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name.trim() : ""
    if (!name) continue
    const kh_g = Number(o.kh_g)
    if (!Number.isFinite(kh_g)) continue
    out.push({
      name,
      kh_g,
      amount_g: o.amount_g != null && Number.isFinite(Number(o.amount_g)) ? Number(o.amount_g) : undefined,
    })
  }
  return out.length ? out : undefined
}
