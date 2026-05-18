import type { CarbConfidence, MealComponent } from "@/lib/types"

export interface PhotoAnalysisResult {
  is_food: boolean
  description?: string
  components?: MealComponent[]
  kh_min?: number
  kh_max?: number
  confidence?: CarbConfidence
  fat_protein_note?: string
  warning?: string
}

function clampKh(n: number): number {
  return Math.min(500, Math.max(0, Math.round(n)))
}

function parseConfidence(v: unknown): CarbConfidence | undefined {
  if (v === "low" || v === "medium" || v === "high") return v
  return undefined
}

function parseComponents(raw: unknown): MealComponent[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: MealComponent[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const name = typeof o.name === "string" ? o.name.trim() : ""
    if (!name) continue
    const kh_g = Number(o.kh_g)
    if (!Number.isFinite(kh_g)) continue
    const comp: MealComponent = { name, kh_g }
    if (typeof o.estimated_amount === "string" && o.estimated_amount.trim()) {
      comp.estimatedAmount = o.estimated_amount.trim()
    }
    if (o.amount_g != null && Number.isFinite(Number(o.amount_g))) {
      comp.amount_g = Number(o.amount_g)
    }
    out.push(comp)
  }
  return out.length ? out : undefined
}

export function parsePhotoAnalysisResponse(raw: unknown): PhotoAnalysisResult {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const is_food = o.is_food === true

  if (!is_food) {
    return { is_food: false }
  }

  let khMin = Number(o.kh_min)
  let khMax = Number(o.kh_max)
  if (!Number.isFinite(khMin) && Number.isFinite(khMax)) khMin = khMax
  if (!Number.isFinite(khMax) && Number.isFinite(khMin)) khMax = khMin

  if (!Number.isFinite(khMin) || !Number.isFinite(khMax)) {
    return { is_food: false }
  }

  khMin = clampKh(khMin)
  khMax = clampKh(Math.max(khMin, khMax))

  return {
    is_food: true,
    description: typeof o.description === "string" ? o.description.trim() : "",
    components: parseComponents(o.components),
    kh_min: khMin,
    kh_max: khMax,
    confidence: parseConfidence(o.confidence),
    fat_protein_note:
      typeof o.fat_protein_note === "string" ? o.fat_protein_note.trim() || undefined : undefined,
    warning: typeof o.warning === "string" ? o.warning.trim() || undefined : undefined,
  }
}
