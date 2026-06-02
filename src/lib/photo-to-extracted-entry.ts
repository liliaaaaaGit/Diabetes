import type { ExtractedEntry } from "@/lib/types"
import type { PhotoAnalysisResult } from "@/lib/parse-photo-analysis"
import { format } from "date-fns"

function confidenceToScore(c: PhotoAnalysisResult["confidence"]): number {
  switch (c) {
    case "high":
      return 0.92
    case "medium":
      return 0.75
    case "low":
      return 0.55
    default:
      return 0.65
  }
}

export function photoAnalysisToExtractedEntry(
  result: PhotoAnalysisResult,
  todayYmd?: string
): ExtractedEntry | null {
  if (!result.is_food || !result.description?.trim()) return null
  const khMin = result.kh_min
  const khMax = result.kh_max
  if (khMin == null || khMax == null) return null

  const midpoint = Math.round((khMin + khMax) / 2)
  const now = new Date()
  const entryDate = todayYmd ?? format(now, "yyyy-MM-dd")
  const entryTime = format(now, "HH:mm")

  return {
    type: "meal",
    clientId: crypto.randomUUID(),
    sourceText: result.description,
    entryDate,
    entryTime,
    confidence: confidenceToScore(result.confidence),
    included: true,
    data: {
      type: "meal",
      description: result.description,
      // Single best-guess value (shown as "~N g KH"); we no longer keep a range.
      carbsGrams: midpoint,
      carbsConfidence: result.confidence,
      components: result.components,
      fatProteinNote: result.fat_protein_note,
      extractionNote: result.warning,
      mealType: "lunch",
      estimated: true,
      mealSource: "photo_ai",
    },
  }
}
