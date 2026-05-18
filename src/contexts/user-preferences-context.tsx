"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  formatGlucose,
  formatGlucoseWithUnit,
  glucoseUnitSuffix,
  mgDlToMmolL,
  mmolLToMgDl,
  storageUnitToDisplay,
  type GlucoseDisplayUnit,
} from "@/lib/glucose-units"
import type { GlucoseUnit } from "@/lib/types"
import { TARGET_RANGE } from "@/lib/constants"
import { useUser } from "@/hooks/useUser"

export interface UserPreferencesState {
  preferredUnit: GlucoseUnit
  displayUnit: GlucoseDisplayUnit
  targetMinMgDl: number
  targetMaxMgDl: number
  loading: boolean
  formatGlucose: (valueMgDl: number) => string
  formatGlucoseWithUnit: (valueMgDl: number) => { value: string; suffix: string }
  unitSuffix: string
  setPreferredUnit: (unit: GlucoseUnit) => Promise<void>
  setTargetRangeMgDl: (min: number, max: number) => Promise<void>
  /** Convert display-unit input to mg/dL for storage. */
  displayValueToMgDl: (displayValue: number) => number
  /** Convert mg/dL to value shown in inputs for current display unit. */
  mgDlToDisplayValue: (mgDl: number) => number
  refresh: () => Promise<void>
}

const UserPreferencesContext = createContext<UserPreferencesState | null>(null)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { userId, isLoggedIn } = useUser()
  const [preferredUnit, setPreferredUnitState] = useState<GlucoseUnit>("mg_dl")
  const [targetMinMgDl, setTargetMinMgDl] = useState(TARGET_RANGE.low)
  const [targetMaxMgDl, setTargetMaxMgDl] = useState(TARGET_RANGE.high)
  const [loading, setLoading] = useState(true)

  const displayUnit = storageUnitToDisplay(preferredUnit)

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/user/settings", { credentials: "include" })
      if (!res.ok) {
        setLoading(false)
        return
      }
      const json = (await res.json()) as {
        settings?: {
          preferredUnit: GlucoseUnit
          targetMinMgDl: number
          targetMaxMgDl: number
        }
      }
      if (json.settings) {
        setPreferredUnitState(json.settings.preferredUnit)
        setTargetMinMgDl(json.settings.targetMinMgDl)
        setTargetMaxMgDl(json.settings.targetMaxMgDl)
      }
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    void load()
  }, [load, userId])

  const patchSettings = useCallback(
    async (patch: {
      preferredUnit?: GlucoseUnit
      targetMinMgDl?: number
      targetMaxMgDl?: number
    }) => {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error("settings_update_failed")
      const json = (await res.json()) as {
        settings: {
          preferredUnit: GlucoseUnit
          targetMinMgDl: number
          targetMaxMgDl: number
        }
      }
      setPreferredUnitState(json.settings.preferredUnit)
      setTargetMinMgDl(json.settings.targetMinMgDl)
      setTargetMaxMgDl(json.settings.targetMaxMgDl)
    },
    []
  )

  const setPreferredUnit = useCallback(
    async (unit: GlucoseUnit) => {
      setPreferredUnitState(unit)
      await patchSettings({ preferredUnit: unit })
    },
    [patchSettings]
  )

  const setTargetRangeMgDl = useCallback(
    async (min: number, max: number) => {
      setTargetMinMgDl(min)
      setTargetMaxMgDl(max)
      await patchSettings({ targetMinMgDl: min, targetMaxMgDl: max })
    },
    [patchSettings]
  )

  const displayValueToMgDl = useCallback(
    (displayValue: number) =>
      displayUnit === "mmol/L" ? mmolLToMgDl(displayValue) : Math.round(displayValue),
    [displayUnit]
  )

  const mgDlToDisplayValue = useCallback(
    (mgDl: number) => (displayUnit === "mmol/L" ? mgDlToMmolL(mgDl) : Math.round(mgDl)),
    [displayUnit]
  )

  const value = useMemo<UserPreferencesState>(
    () => ({
      preferredUnit,
      displayUnit,
      targetMinMgDl,
      targetMaxMgDl,
      loading,
      formatGlucose: (v) => formatGlucose(v, displayUnit),
      formatGlucoseWithUnit: (v) => formatGlucoseWithUnit(v, displayUnit),
      unitSuffix: glucoseUnitSuffix(displayUnit),
      setPreferredUnit,
      setTargetRangeMgDl,
      displayValueToMgDl,
      mgDlToDisplayValue,
      refresh: load,
    }),
    [
      preferredUnit,
      displayUnit,
      targetMinMgDl,
      targetMaxMgDl,
      loading,
      setPreferredUnit,
      setTargetRangeMgDl,
      displayValueToMgDl,
      mgDlToDisplayValue,
      load,
    ]
  )

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  )
}

export function useUserPreferences(): UserPreferencesState {
  const ctx = useContext(UserPreferencesContext)
  if (!ctx) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider")
  }
  return ctx
}
