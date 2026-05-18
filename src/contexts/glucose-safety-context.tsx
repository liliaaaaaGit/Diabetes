"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { SafetyBanner, SAFETY_BANNER_AUTO_DISMISS_MS } from "@/components/shared/safety-banner"
import {
  getGlucoseSafetyKind,
  glucoseEntryMgDlForSafety,
  safetyBannerLevelForKind,
} from "@/lib/glucose-safety"
import type { Entry, GlucoseEntry } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"

type ActiveBanner = {
  level: "danger" | "warn"
  title: string
  body: string
}

type GlucoseSafetyContextValue = {
  /** Call after a glucose entry was saved successfully. */
  showGlucoseSafetyIfNeeded: (entry: Entry | Partial<GlucoseEntry>) => void
}

const GlucoseSafetyContext = createContext<GlucoseSafetyContextValue | null>(null)

export function GlucoseSafetyProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [banner, setBanner] = useState<ActiveBanner | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setBanner(null)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const showGlucoseSafetyIfNeeded = useCallback(
    (entry: Entry | Partial<GlucoseEntry>) => {
      const mgDl = glucoseEntryMgDlForSafety(
        entry as Pick<GlucoseEntry, "type" | "value" | "unit">
      )
      if (mgDl == null) return

      const kind = getGlucoseSafetyKind(mgDl)
      if (!kind) return

      const level = safetyBannerLevelForKind(kind)
      const title =
        kind === "low" ? t("safety.glucoseLow.title") : t("safety.glucoseHigh.title")
      const body =
        kind === "low" ? t("safety.glucoseLow.body") : t("safety.glucoseHigh.body")

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      setBanner({ level, title, body })
      dismissTimerRef.current = setTimeout(dismiss, SAFETY_BANNER_AUTO_DISMISS_MS)
    },
    [t, dismiss]
  )

  return (
    <GlucoseSafetyContext.Provider value={{ showGlucoseSafetyIfNeeded }}>
      {children}
      {banner && (
        <SafetyBanner
          level={banner.level}
          title={banner.title}
          body={banner.body}
          onClose={dismiss}
        />
      )}
    </GlucoseSafetyContext.Provider>
  )
}

export function useGlucoseSafetyBanner(): GlucoseSafetyContextValue {
  const ctx = useContext(GlucoseSafetyContext)
  if (!ctx) {
    throw new Error("useGlucoseSafetyBanner must be used within GlucoseSafetyProvider")
  }
  return ctx
}
