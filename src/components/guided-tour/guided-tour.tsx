"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useGuidedTour } from "@/contexts/guided-tour-context"
import { cn } from "@/lib/utils"
import {
  TOUR_PHASE_COUNT,
  TOUR_PHASE_ROUTES,
  TOUR_PHASES,
  routeMatchesPhase,
} from "@/lib/guided-tour-phases"

const OVERLAY_Z = 9999
const CARD_Z = 10000
const FADE_MS = 300

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return mobile
}

interface GuidedTourProps {
  onComplete: () => void
}

export function GuidedTour({ onComplete }: GuidedTourProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { isActive, tourPhase, setTourPhase, endTour } = useGuidedTour()
  const isMobile = useIsMobile()

  const [cardVisible, setCardVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  const phase = TOUR_PHASES[tourPhase]
  const routeReady = routeMatchesPhase(pathname, tourPhase)
  const progressPct = tourPhase <= 0 ? 0 : (tourPhase / (TOUR_PHASE_COUNT - 1)) * 100

  const persistComplete = useCallback(async () => {
    const res = await fetch("/api/user/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ onboarding_completed: true }),
    })
    if (!res.ok) throw new Error("save_failed")
  }, [])

  const closeTour = useCallback(async () => {
    setCardVisible(false)
    endTour()
    onComplete()
    router.refresh()
  }, [endTour, onComplete, router])

  const skip = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      await persistComplete()
      await closeTour()
    } catch {
      toast({ title: t("onboarding.saveFailed"), variant: "destructive" })
      setSaving(false)
    }
  }, [closeTour, persistComplete, saving, t, toast])

  const goToPhase = useCallback(
    async (nextPhase: number, options?: { completeFirst?: boolean }) => {
      if (saving || !phase) return
      setSaving(true)
      setCardVisible(false)

      await new Promise((r) => setTimeout(r, 200))

      try {
        if (options?.completeFirst) {
          await persistComplete()
        }

        const nextRoute = TOUR_PHASE_ROUTES[nextPhase]
        if (nextRoute) {
          router.push(nextRoute)
        }
        setTourPhase(nextPhase)

        await new Promise((r) => setTimeout(r, FADE_MS))
      } catch {
        toast({ title: t("onboarding.saveFailed"), variant: "destructive" })
        setSaving(false)
        return
      }

      setSaving(false)
    },
    [persistComplete, phase, router, saving, setTourPhase, t, toast]
  )

  const handlePrimary = () => {
    if (!phase || saving) return

    if (tourPhase >= TOUR_PHASE_COUNT - 1) {
      void goToPhase(tourPhase, { completeFirst: true }).then(() => {
        void closeTour()
      })
      return
    }

    const next = tourPhase + 1
    void goToPhase(next, { completeFirst: phase.completeOnboardingOnPrimary })
  }

  useEffect(() => {
    if (!isActive) {
      setCardVisible(false)
      return
    }
    const expected = TOUR_PHASE_ROUTES[tourPhase]
    if (expected && pathname !== expected) {
      router.replace(expected)
      setCardVisible(false)
      return
    }
    const tId = window.setTimeout(() => setCardVisible(true), routeReady ? 80 : FADE_MS)
    return () => window.clearTimeout(tId)
  }, [isActive, tourPhase, pathname, routeReady, router])

  if (!isActive || !phase || !routeReady) {
    return null
  }

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: OVERLAY_Z }}
      role="dialog"
      aria-modal="true"
      aria-label={t(phase.titleKey)}
    >
      <div
        className={cn(
          "pointer-events-auto absolute inset-0 bg-black/50 transition-opacity ease-out",
          cardVisible ? "opacity-100 duration-300" : "opacity-0 duration-200"
        )}
        aria-hidden
        onClick={(e) => e.preventDefault()}
      />

      <div
        className={cn(
          "pointer-events-auto fixed left-1/2 w-[calc(100vw-24px)] sm:w-[min(92vw,680px)] md:min-w-[420px] -translate-x-1/2 transition-all ease-out",
          isMobile ? "top-[45%] -translate-y-[45%]" : "top-1/2 -translate-y-1/2",
          cardVisible ? "scale-100 opacity-100 duration-300" : "scale-95 opacity-0 duration-200"
        )}
        style={{ zIndex: CARD_Z }}
      >
        <div className="rounded-2xl bg-white px-7 py-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:px-7 sm:py-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold leading-snug text-slate-900">{t(phase.titleKey)}</h2>
            <button
              type="button"
              onClick={() => void skip()}
              disabled={saving}
              className="shrink-0 text-[13px] text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {t("onboarding.skip")}
            </button>
          </div>

          <p className="text-[15px] leading-normal text-[#666]">{t(phase.bodyKey)}</p>

          {phase.hintKey ? (
            <p className="mt-3 text-[14px] leading-normal text-slate-500">{t(phase.hintKey)}</p>
          ) : null}

          {phase.features && phase.features.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-2">
              {phase.features.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.textKey} className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0 text-teal-600" strokeWidth={1.75} aria-hidden />
                    <span className="text-sm leading-snug text-slate-700 sm:text-[14px]">
                      {t(item.textKey)}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : null}

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-[60%]">
              <div className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {t("onboarding.stepOf", { current: tourPhase + 1, total: TOUR_PHASE_COUNT })}
              </span>
            </div>

            <Button
              type="button"
              onClick={handlePrimary}
              disabled={saving}
              className={cn(
                "h-auto rounded-[10px] bg-teal-500 px-6 py-2.5 text-[15px] font-semibold text-white hover:bg-teal-600",
                "w-full sm:w-auto sm:shrink-0"
              )}
            >
              {saving ? t("common.loading") : t(phase.primaryKey)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
