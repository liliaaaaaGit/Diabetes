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

/** True for AI-produced carb estimates (free-text or photo). */
function isAiCarbEstimate(meal: MealEntry): boolean {
  return (
    meal.mealSource === "freetext_ai" ||
    meal.mealSource === "photo_ai" ||
    meal.estimated === true
  )
}

/**
 * Carb label rules:
 *  - user-corrected value → exact value (the user typed it)
 *  - manual entry → exact value
 *  - AI estimate → a single best-guess value prefixed with "~" (e.g. "~85 g KH").
 *    A range would be redundant next to the "Sicherheit:" indicator and forces
 *    the user to pick between two numbers, so we always show one value.
 */
export function formatMealCarbsLabel(
  meal: MealEntry,
  locale: "de" | "en" = "de"
): string | null {
  if (meal.userCorrectedKh != null) {
    return formatCarbsGrams(meal.userCorrectedKh, locale)
  }

  // Single value: stored midpoint (or the midpoint of a legacy min/max range).
  const value = mealCarbsMidpoint(meal)
  if (value == null) return null

  if (isAiCarbEstimate(meal)) {
    if (value < 0) return null
    // "~" signals an estimate, not an exact measurement.
    return `~${formatCarbsGrams(value, locale)}`
  }

  if (value > 0) return formatCarbsGrams(value, locale)
  return null
}

/**
 * Map a numeric AI confidence score (0..1) to the single three-level scale
 * used everywhere in the UI. Thresholds (per expert review):
 *   niedrig = 0–60%, mittel = 60–85%, hoch = 85–100%.
 */
export function confidenceLevelFromScore(score: number): CarbConfidence {
  if (!Number.isFinite(score)) return "medium"
  if (score >= 0.85) return "high"
  if (score >= 0.6) return "medium"
  return "low"
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

/**
 * High-protein / high-fat foods that can raise blood glucose with a delay
 * (the "pizza"/protein effect, 3–5 h later). Used only to show a NEUTRAL
 * information hint — never a dosing or action suggestion.
 */
const PROTEIN_FAT_KEYWORDS = [
  "fleisch",
  "huhn",
  "hähnchen", // also matches "hähnchenbrust"
  "haehnchen",
  "hühn",
  "steak",
  "rind",
  "schwein",
  "lachs",
  "fisch",
  "thunfisch",
  "käse",
  "kaese",
  "ei", // matches "ei", "eier"
  "omelette",
  "nuss",
  "nüsse",
  "nuesse",
  "erdnuss",
  "mandel", // matches "mandeln"
  "avocado",
  "speck",
  "bacon",
  "wurst",
  "salami",
  "schinken",
  "schnitzel",
  "burger",
  "quark", // matches "magerquark"
  "joghurt", // matches "griechischer joghurt"
  "tofu",
  "pute", // matches "putenbrust"
]

/** Threshold below which carbs count as "low/zero" for the protein/fat hint. */
const LOW_CARB_THRESHOLD_G = 15

/**
 * True when a meal looks low-carb but high in protein/fat — the case where a
 * "0 g carbs, done" reading could be misleading because BG may rise later.
 */
export function isHighProteinFatLowCarb(meal: MealEntry): boolean {
  const carbs = mealCarbsForSum(meal)
  if (carbs >= LOW_CARB_THRESHOLD_G) return false

  const haystack = [
    meal.description ?? "",
    ...(meal.components?.map((c) => c.name) ?? []),
  ]
    .join(" ")
    .toLowerCase()

  if (!haystack.trim()) return false
  return PROTEIN_FAT_KEYWORDS.some((kw) => haystack.includes(kw))
}

export function hasAiMealEstimate(meal: MealEntry): boolean {
  return (
    meal.mealSource === "freetext_ai" ||
    meal.mealSource === "photo_ai" ||
    meal.carbsConfidence != null ||
    meal.carbsMinGrams != null ||
    meal.components != null ||
    meal.extractionNote != null
  )
}

export function isPhotoMealEstimate(meal: MealEntry): boolean {
  return meal.mealSource === "photo_ai"
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
    const comp: MealComponent = {
      name,
      kh_g,
      amount_g: o.amount_g != null && Number.isFinite(Number(o.amount_g)) ? Number(o.amount_g) : undefined,
    }
    const est =
      typeof o.estimated_amount === "string"
        ? o.estimated_amount.trim()
        : typeof o.estimatedAmount === "string"
          ? o.estimatedAmount.trim()
          : ""
    if (est) comp.estimatedAmount = est
    out.push(comp)
  }
  return out.length ? out : undefined
}
