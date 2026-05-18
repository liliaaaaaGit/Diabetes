import { mgDlToMmolL, mmolLToMgDl, type GlucoseDisplayUnit } from "@/lib/glucose-units"

/** Allowed stored target range in mg/dL (internal storage). */
export const TARGET_RANGE_LIMITS_MG_DL = {
  min: 50,
  max: 300,
} as const

export type TargetRangeValidationCode =
  | "invalid_number"
  | "min_not_less_than_max"
  | "out_of_bounds"

export function validateTargetRangeMgDl(
  minMgDl: number,
  maxMgDl: number
): { ok: true; min: number; max: number } | { ok: false; code: TargetRangeValidationCode } {
  if (!Number.isFinite(minMgDl) || !Number.isFinite(maxMgDl)) {
    return { ok: false, code: "invalid_number" }
  }
  const min = Math.round(minMgDl)
  const max = Math.round(maxMgDl)
  if (min <= 0 || max <= 0 || min >= max) {
    return { ok: false, code: "min_not_less_than_max" }
  }
  if (
    min < TARGET_RANGE_LIMITS_MG_DL.min ||
    max > TARGET_RANGE_LIMITS_MG_DL.max
  ) {
    return { ok: false, code: "out_of_bounds" }
  }
  return { ok: true, min, max }
}

export function parseTargetRangeFromDisplay(
  minDisplay: number,
  maxDisplay: number,
  displayUnit: GlucoseDisplayUnit
): ReturnType<typeof validateTargetRangeMgDl> {
  const minMg =
    displayUnit === "mmol/L" ? mmolLToMgDl(minDisplay) : Math.round(minDisplay)
  const maxMg =
    displayUnit === "mmol/L" ? mmolLToMgDl(maxDisplay) : Math.round(maxDisplay)
  return validateTargetRangeMgDl(minMg, maxMg)
}

export function formatTargetRangeLabel(
  minMgDl: number,
  maxMgDl: number,
  displayUnit: GlucoseDisplayUnit
): string {
  if (displayUnit === "mmol/L") {
    return `${mgDlToMmolL(minMgDl).toFixed(1)}–${mgDlToMmolL(maxMgDl).toFixed(1)} mmol/L`
  }
  return `${Math.round(minMgDl)}–${Math.round(maxMgDl)} mg/dL`
}
