"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { formatTargetRangeLabel } from "@/lib/target-range"
import { readCachedUserPrefs, writeCachedUserPrefs } from "@/lib/client-prefs-cache"
import { useUser } from "@/hooks/useUser"

export interface TargetRangeMgDl {
  min: number
  max: number
}

export interface UserPreferencesState {
  preferredUnit: GlucoseUnit
  displayUnit: GlucoseDisplayUnit
  targetMinMgDl: number
  targetMaxMgDl: number
  targetRange: TargetRangeMgDl
  loading: boolean
  formatTargetRangeLabel: () => string
  formatGlucose: (valueMgDl: number) => string
  formatGlucoseWithUnit: (valueMgDl: number) => { value: string; suffix: string }
  unitSuffix: string
  setPreferredUnit: (unit: GlucoseUnit) => Promise<void>
  setTargetRangeMgDl: (min: number, max: number) => Promise<void>
  displayValueToMgDl: (displayValue: number) => number
  mgDlToDisplayValue: (mgDl: number) => number
  refresh: () => Promise<void>
}

const UserPreferencesContext = createContext<UserPreferencesState | null>(null)

function applySettingsToState(
  settings: {
    preferredUnit: GlucoseUnit
    targetMinMgDl: number
    targetMaxMgDl: number
  },
  setPreferredUnitState: (u: GlucoseUnit) => void,
  setTargetMinMgDl: (n: number) => void,
  setTargetMaxMgDl: (n: number) => void
) {
  setPreferredUnitState(settings.preferredUnit)
  setTargetMinMgDl(settings.targetMinMgDl)
  setTargetMaxMgDl(settings.targetMaxMgDl)
  writeCachedUserPrefs(settings)
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { userId, isLoggedIn, isSessionReady } = useUser()
  const cached = readCachedUserPrefs()

  const [preferredUnit, setPreferredUnitState] = useState<GlucoseUnit>(
    cached?.preferredUnit ?? "mg_dl"
  )
  const [targetMinMgDl, setTargetMinMgDl] = useState(
    cached?.targetMinMgDl ?? TARGET_RANGE.low
  )
  const [targetMaxMgDl, setTargetMaxMgDl] = useState(
    cached?.targetMaxMgDl ?? TARGET_RANGE.high
  )
  const [loading, setLoading] = useState(true)

  const saveInFlightRef = useRef(0)
  const hasLoadedForUserRef = useRef<string | null>(null)

  const displayUnit = storageUnitToDisplay(preferredUnit)

  const load = useCallback(
    async (force = false) => {
      if (!isSessionReady) return
      if (!isLoggedIn || !userId) {
        setLoading(false)
        return
      }
      if (saveInFlightRef.current > 0) return
      if (!force && hasLoadedForUserRef.current === userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch("/api/user/settings", { credentials: "include" })
        if (!res.ok) {
          console.error("[user-preferences] load failed:", res.status)
          return
        }
        const json = (await res.json()) as {
          settings?: {
            preferredUnit: GlucoseUnit
            targetMinMgDl: number
            targetMaxMgDl: number
          }
        }
        if (json.settings && saveInFlightRef.current === 0) {
          applySettingsToState(
            json.settings,
            setPreferredUnitState,
            setTargetMinMgDl,
            setTargetMaxMgDl
          )
          hasLoadedForUserRef.current = userId
        }
      } catch (e) {
        console.error("[user-preferences] load error:", e)
      } finally {
        setLoading(false)
      }
    },
    [isSessionReady, isLoggedIn, userId]
  )

  useEffect(() => {
    hasLoadedForUserRef.current = null
    void load(false)
  }, [userId, isSessionReady, isLoggedIn, load])

  const patchSettings = useCallback(
    async (patch: {
      preferredUnit?: GlucoseUnit
      targetMinMgDl?: number
      targetMaxMgDl?: number
    }) => {
      saveInFlightRef.current += 1
      try {
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(patch),
        })
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(errBody.error ?? "settings_update_failed")
        }
        const json = (await res.json()) as {
          settings: {
            preferredUnit: GlucoseUnit
            targetMinMgDl: number
            targetMaxMgDl: number
          }
        }
        applySettingsToState(
          json.settings,
          setPreferredUnitState,
          setTargetMinMgDl,
          setTargetMaxMgDl
        )
        if (userId) {
          hasLoadedForUserRef.current = userId
        }
        return json.settings
      } finally {
        saveInFlightRef.current -= 1
      }
    },
    [userId]
  )

  const setPreferredUnit = useCallback(
    async (unit: GlucoseUnit) => {
      const previous = preferredUnit
      setPreferredUnitState(unit)
      try {
        await patchSettings({ preferredUnit: unit })
      } catch (e) {
        setPreferredUnitState(previous)
        throw e
      }
    },
    [preferredUnit, patchSettings]
  )

  const setTargetRangeMgDl = useCallback(
    async (min: number, max: number) => {
      const prevMin = targetMinMgDl
      const prevMax = targetMaxMgDl
      setTargetMinMgDl(min)
      setTargetMaxMgDl(max)
      try {
        await patchSettings({ targetMinMgDl: min, targetMaxMgDl: max })
      } catch (e) {
        setTargetMinMgDl(prevMin)
        setTargetMaxMgDl(prevMax)
        throw e
      }
    },
    [targetMinMgDl, targetMaxMgDl, patchSettings]
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

  const targetRange = useMemo<TargetRangeMgDl>(
    () => ({ min: targetMinMgDl, max: targetMaxMgDl }),
    [targetMinMgDl, targetMaxMgDl]
  )

  const formatTargetRangeLabelFn = useCallback(
    () => formatTargetRangeLabel(targetMinMgDl, targetMaxMgDl, displayUnit),
    [targetMinMgDl, targetMaxMgDl, displayUnit]
  )

  const value = useMemo<UserPreferencesState>(
    () => ({
      preferredUnit,
      displayUnit,
      targetMinMgDl,
      targetMaxMgDl,
      targetRange,
      loading,
      formatTargetRangeLabel: formatTargetRangeLabelFn,
      formatGlucose: (v) => formatGlucose(v, displayUnit),
      formatGlucoseWithUnit: (v) => formatGlucoseWithUnit(v, displayUnit),
      unitSuffix: glucoseUnitSuffix(displayUnit),
      setPreferredUnit,
      setTargetRangeMgDl,
      displayValueToMgDl,
      mgDlToDisplayValue,
      refresh: () => load(true),
    }),
    [
      preferredUnit,
      displayUnit,
      targetMinMgDl,
      targetMaxMgDl,
      targetRange,
      loading,
      formatTargetRangeLabelFn,
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
