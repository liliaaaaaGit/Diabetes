import type { GlucoseUnit } from "@/lib/types"

/** mg/dL per 1 mmol/L (standard conversion factor). */
export const MG_DL_PER_MMOL_L = 18.0182

export type GlucoseDisplayUnit = "mg/dL" | "mmol/L"

export function storageUnitToDisplay(unit: GlucoseUnit): GlucoseDisplayUnit {
  return unit === "mmol_l" ? "mmol/L" : "mg/dL"
}

export function displayUnitToStorage(unit: GlucoseDisplayUnit): GlucoseUnit {
  return unit === "mmol/L" ? "mmol_l" : "mg_dl"
}

export function mgDlToMmolL(mgDl: number): number {
  return Math.round((mgDl / MG_DL_PER_MMOL_L) * 10) / 10
}

export function mmolLToMgDl(mmol: number): number {
  return Math.round(mmol * MG_DL_PER_MMOL_L)
}

/** Values in DB are always mg/dL; this helper exists for legacy paths. */
export function glucoseToMgDl(value: number, _entryUnit: GlucoseUnit = "mg_dl"): number {
  return value
}

export function formatGlucose(valueMgDl: number, unit: GlucoseDisplayUnit): string {
  if (!Number.isFinite(valueMgDl)) return "—"
  if (unit === "mmol/L") {
    return mgDlToMmolL(valueMgDl).toFixed(1)
  }
  return String(Math.round(valueMgDl))
}

export function glucoseUnitSuffix(unit: GlucoseDisplayUnit): string {
  return unit
}

export function formatGlucoseWithUnit(
  valueMgDl: number,
  unit: GlucoseDisplayUnit
): { value: string; suffix: string } {
  return {
    value: formatGlucose(valueMgDl, unit),
    suffix: glucoseUnitSuffix(unit),
  }
}

/** Chart Y-axis domain and TIR band in display units. */
export function glucoseChartScale(displayUnit: GlucoseDisplayUnit, targetMinMgDl: number, targetMaxMgDl: number) {
  const toDisplay = (mg: number) =>
    displayUnit === "mmol/L" ? mgDlToMmolL(mg) : Math.round(mg)
  return {
    yMin: displayUnit === "mmol/L" ? 3.3 : 60,
    yMax: displayUnit === "mmol/L" ? 11.1 : 200,
    targetLow: toDisplay(targetMinMgDl),
    targetHigh: toDisplay(targetMaxMgDl),
  }
}
