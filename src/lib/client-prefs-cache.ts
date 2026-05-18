import type { GlucoseUnit } from "@/lib/types"

const STORAGE_KEY = "gc_user_prefs_v1"

export interface CachedUserPrefs {
  preferredUnit: GlucoseUnit
  targetMinMgDl: number
  targetMaxMgDl: number
}

export function readCachedUserPrefs(): CachedUserPrefs | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedUserPrefs
    if (
      (parsed.preferredUnit === "mg_dl" || parsed.preferredUnit === "mmol_l") &&
      Number.isFinite(parsed.targetMinMgDl) &&
      Number.isFinite(parsed.targetMaxMgDl)
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function writeCachedUserPrefs(prefs: CachedUserPrefs): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota errors */
  }
}
