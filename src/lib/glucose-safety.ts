import type { GlucoseEntry } from "@/lib/types"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"

/** Fixed safety thresholds (mg/dL) — not the user's target range. */
export const GLUCOSE_SAFETY_LOW_MG_DL = 70
export const GLUCOSE_SAFETY_HIGH_MG_DL = 250

export type GlucoseSafetyKind = "low" | "high"
export type SafetyBannerLevel = "danger" | "warn"

export function getGlucoseSafetyKind(mgDl: number): GlucoseSafetyKind | null {
  if (mgDl < GLUCOSE_SAFETY_LOW_MG_DL) return "low"
  if (mgDl > GLUCOSE_SAFETY_HIGH_MG_DL) return "high"
  return null
}

export function safetyBannerLevelForKind(kind: GlucoseSafetyKind): SafetyBannerLevel {
  return kind === "low" ? "danger" : "warn"
}

export function glucoseEntryMgDlForSafety(
  entry: Pick<GlucoseEntry, "type" | "value" | "unit">
): number | null {
  if (entry.type !== "glucose" || typeof entry.value !== "number" || !Number.isFinite(entry.value)) {
    return null
  }
  return glucoseEntryToMgDl(entry)
}
