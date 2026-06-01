import type {
  CarbConfidence,
  EntryType,
  ExtractedEntry,
  GlucoseContext,
  InsulinType,
  Intensity,
  MoodValue,
} from "@/lib/types"
import { normalizeComponents } from "@/lib/meal-carbs"

function confidenceToScore(c: CarbConfidence | undefined): number {
  switch (c) {
    case "high":
      return 0.92
    case "medium":
      return 0.75
    case "low":
      return 0.55
    default:
      return 0.7
  }
}

function parseConfidence(v: unknown): CarbConfidence | undefined {
  if (v === "low" || v === "medium" || v === "high") return v
  return undefined
}

function clampKh(n: number): number {
  return Math.min(500, Math.max(0, Math.round(n)))
}

const GLUCOSE_CONTEXTS: GlucoseContext[] = [
  "fasting",
  "pre_meal",
  "post_meal",
  "bedtime",
  "other",
]
const INSULIN_TYPES: InsulinType[] = ["rapid", "long_acting", "mixed", "other"]
const INTENSITIES: Intensity[] = ["low", "medium", "high"]

function parseGlucoseContext(v: unknown): GlucoseContext {
  return typeof v === "string" && GLUCOSE_CONTEXTS.includes(v as GlucoseContext)
    ? (v as GlucoseContext)
    : "other"
}

function parseInsulinType(v: unknown): InsulinType {
  return typeof v === "string" && INSULIN_TYPES.includes(v as InsulinType)
    ? (v as InsulinType)
    : "rapid"
}

function parseIntensity(v: unknown): Intensity {
  return typeof v === "string" && INTENSITIES.includes(v as Intensity)
    ? (v as Intensity)
    : "medium"
}

function parseMoodValue(v: unknown): MoodValue {
  const n = Math.min(5, Math.max(1, Math.round(Number(v) || 3)))
  return n as MoodValue
}

export function parseExtractResponse(
  raw: unknown,
  sourceText: string,
  todayYmd: string
): { entries: ExtractedEntry[]; message?: string } {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const message = typeof root.message === "string" ? root.message : undefined
  const list = Array.isArray(root.entries) ? root.entries : []

  const entries: ExtractedEntry[] = []

  for (const item of list) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const type = o.type as EntryType | undefined
    if (!type) continue

    const entryDate =
      typeof o.timestamp === "string" && o.timestamp.length >= 10
        ? o.timestamp.slice(0, 10)
        : todayYmd

    // Keep the time-of-day if the model returned one (local "...THH:mm").
    // Undefined = the confirmation UI will default to the current time.
    const entryTime =
      typeof o.timestamp === "string" &&
      o.timestamp.includes("T") &&
      o.timestamp.length >= 16
        ? o.timestamp.slice(11, 16)
        : undefined

    if (type === "meal") {
      const description = String(o.description ?? "").trim()
      if (!description) continue
      // Prefer the single value the AI now returns; fall back to a legacy range.
      const khSingle = Number(o.kh_g)
      let midpoint: number
      if (Number.isFinite(khSingle)) {
        midpoint = clampKh(khSingle)
      } else {
        let khMin = Number(o.kh_min)
        let khMax = Number(o.kh_max)
        if (!Number.isFinite(khMin) && Number.isFinite(khMax)) khMin = khMax
        if (!Number.isFinite(khMax) && Number.isFinite(khMin)) khMax = khMin
        if (!Number.isFinite(khMin) || !Number.isFinite(khMax)) continue
        khMin = clampKh(khMin)
        khMax = clampKh(Math.max(khMin, khMax))
        midpoint = Math.round((khMin + khMax) / 2)
      }
      const confidence = parseConfidence(o.confidence)
      const components = normalizeComponents(o.components)

      entries.push({
        type: "meal",
        sourceText,
        entryDate,
        entryTime,
        confidence: confidenceToScore(confidence),
        included: true,
        data: {
          type: "meal",
          description,
          // Single best-guess value (shown as "~N g KH"); we no longer keep a range.
          carbsGrams: midpoint,
          carbsConfidence: confidence,
          components,
          fatProteinNote:
            typeof o.fat_protein_note === "string" ? o.fat_protein_note.trim() || undefined : undefined,
          extractionNote:
            typeof o.extraction_note === "string" ? o.extraction_note.trim() || undefined : undefined,
          mealType: "lunch",
          estimated: true,
          mealSource: "freetext_ai",
        },
      })
      continue
    }

    if (type === "glucose") {
      const value = Number(o.value)
      if (!Number.isFinite(value)) continue
      entries.push({
        type: "glucose",
        sourceText,
        entryDate,
        entryTime,
        confidence: 0.85,
        included: true,
        data: {
          type: "glucose",
          value,
          unit: "mg_dl",
          context: parseGlucoseContext(o.context),
        },
      })
      continue
    }

    if (type === "insulin") {
      const dose = Number(o.dose)
      if (!Number.isFinite(dose) || dose <= 0) continue
      entries.push({
        type: "insulin",
        sourceText,
        entryDate,
        entryTime,
        confidence: 0.85,
        included: true,
        data: {
          type: "insulin",
          dose,
          insulinType: parseInsulinType(o.insulinType),
          insulinName: typeof o.insulinName === "string" ? o.insulinName : undefined,
        },
      })
      continue
    }

    if (type === "activity") {
      const activityType = String(o.activityType ?? "").trim()
      if (!activityType) continue
      entries.push({
        type: "activity",
        sourceText,
        entryDate,
        entryTime,
        confidence: 0.8,
        included: true,
        data: {
          type: "activity",
          activityType,
          durationMinutes: Number(o.durationMinutes) || 0,
          intensity: parseIntensity(o.intensity),
        },
      })
      continue
    }

    if (type === "mood") {
      entries.push({
        type: "mood",
        sourceText,
        entryDate,
        entryTime,
        confidence: 0.75,
        included: true,
        data: { type: "mood", moodValue: parseMoodValue(o.moodValue) },
      })
    }
  }

  return { entries, message }
}
