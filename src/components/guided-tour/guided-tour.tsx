"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  GUIDED_TOUR_SPOTLIGHT_PADDING,
  GUIDED_TOUR_STEPS,
  type GuidedTourPlacement,
} from "@/lib/guided-tour-steps"

const MOBILE_BREAKPOINT = 768
const OVERLAY_Z = 9999

type Rect = {
  top: number
  left: number
  width: number
  height: number
}

interface GuidedTourProps {
  onComplete: () => void
  onOpenMobileNav?: () => void
  onCloseMobileNav?: () => void
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return mobile
}

function getTargetRect(selector: string): Rect | null {
  const nodes = document.querySelectorAll(selector)
  for (const el of nodes) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }
  }
  return null
}

function computeTooltipStyle(
  rect: Rect | null,
  placement: GuidedTourPlacement,
  isMobile: boolean
): { style: React.CSSProperties; arrowClass: string } {
  const pad = 12
  const maxW = isMobile ? "calc(100vw - 32px)" : "280px"

  if (!rect || placement === "center") {
    return {
      style: {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: maxW,
        zIndex: OVERLAY_Z + 2,
      },
      arrowClass: "hidden",
    }
  }

  const effectivePlacement = isMobile ? "bottom" : placement
  const spotlightBottom = rect.top + rect.height + GUIDED_TOUR_SPOTLIGHT_PADDING
  const spotlightTop = rect.top - GUIDED_TOUR_SPOTLIGHT_PADDING
  const spotlightLeft = rect.left - GUIDED_TOUR_SPOTLIGHT_PADDING
  const spotlightRight = rect.left + rect.width + GUIDED_TOUR_SPOTLIGHT_PADDING
  const centerX = rect.left + rect.width / 2

  const clampLeft = () => Math.max(16, Math.min(centerX - 140, window.innerWidth - 296))

  if (effectivePlacement === "top") {
    return {
      style: {
        position: "fixed",
        top: spotlightTop - pad,
        left: clampLeft(),
        transform: "translateY(-100%)",
        maxWidth: maxW,
        zIndex: OVERLAY_Z + 2,
      },
      arrowClass:
        "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-white border-b-transparent",
    }
  }

  if (effectivePlacement === "right") {
    return {
      style: {
        position: "fixed",
        top: rect.top + rect.height / 2,
        left: spotlightRight + pad,
        transform: "translateY(-50%)",
        maxWidth: maxW,
        zIndex: OVERLAY_Z + 2,
      },
      arrowClass:
        "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-white border-l-transparent",
    }
  }

  if (effectivePlacement === "left") {
    return {
      style: {
        position: "fixed",
        top: rect.top + rect.height / 2,
        left: Math.max(16, spotlightLeft - 280 - pad),
        transform: "translateY(-50%)",
        maxWidth: maxW,
        zIndex: OVERLAY_Z + 2,
      },
      arrowClass:
        "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-white border-r-transparent",
    }
  }

  return {
    style: {
      position: "fixed",
      top: spotlightBottom + pad,
      left: clampLeft(),
      maxWidth: maxW,
      zIndex: OVERLAY_Z + 2,
    },
    arrowClass:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-white border-t-transparent",
  }
}

export function GuidedTour({ onComplete, onOpenMobileNav, onCloseMobileNav }: GuidedTourProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [saving, setSaving] = useState(false)

  const step = GUIDED_TOUR_STEPS[stepIndex]
  const total = GUIDED_TOUR_STEPS.length
  const isWelcome = step.placement === "center" || !step.target
  const isLast = stepIndex === total - 1

  const finish = useCallback(async () => {
    if (saving) return
    setSaving(true)
    onCloseMobileNav?.()
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboarding_completed: true }),
      })
      if (!res.ok) throw new Error("save_failed")
      setVisible(false)
      onComplete()
      router.refresh()
    } catch {
      toast({ title: t("onboarding.saveFailed"), variant: "destructive" })
      setSaving(false)
    }
  }, [onCloseMobileNav, onComplete, router, saving, t, toast])

  const goNext = () => {
    if (isLast) void finish()
    else setStepIndex((i) => i + 1)
  }

  const updateRect = useCallback(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }
    setTargetRect(getTargetRect(step.target))
  }, [step.target])

  useEffect(() => {
    router.replace("/")
  }, [router])

  useLayoutEffect(() => {
    setVisible(false)
    let cancelled = false

    const run = async () => {
      if (step.openMobileNav && isMobile) {
        onOpenMobileNav?.()
        await new Promise((r) => setTimeout(r, 350))
      } else if (!step.openMobileNav) {
        onCloseMobileNav?.()
      }

      if (step.target) {
        const el = document.querySelector(step.target)
        el?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" })
        await new Promise((r) => setTimeout(r, 320))
      }

      if (!cancelled) {
        updateRect()
        setVisible(true)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [stepIndex, step.target, step.openMobileNav, isMobile, onOpenMobileNav, onCloseMobileNav, updateRect])

  useEffect(() => {
    if (!step.target) return
    const onResize = () => updateRect()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
    }
  }, [step.target, updateRect])

  const primaryLabel = step.primaryKey
    ? t(step.primaryKey)
    : isLast
      ? t("onboarding.discoverApp")
      : t("onboarding.next")

  const { style: tooltipStyle, arrowClass } = computeTooltipStyle(
    targetRect,
    step.placement ?? "bottom",
    isMobile
  )

  const spotlight =
    targetRect && !isWelcome
      ? {
          top: targetRect.top - GUIDED_TOUR_SPOTLIGHT_PADDING,
          left: targetRect.left - GUIDED_TOUR_SPOTLIGHT_PADDING,
          width: targetRect.width + GUIDED_TOUR_SPOTLIGHT_PADDING * 2,
          height: targetRect.height + GUIDED_TOUR_SPOTLIGHT_PADDING * 2,
        }
      : null

  const dim = visible ? 0.6 : 0
  const dimBg = "rgba(0, 0, 0, 0.6)"

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: OVERLAY_Z }}
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.welcomeTitle")}
    >
      {isWelcome ? (
        <div
          className="pointer-events-auto absolute inset-0 transition-opacity duration-300"
          style={{ backgroundColor: dimBg, opacity: dim }}
          aria-hidden
        />
      ) : spotlight ? (
        <>
          <div
            className="pointer-events-auto fixed left-0 right-0 top-0 transition-opacity duration-300"
            style={{ height: spotlight.top, backgroundColor: dimBg, opacity: dim }}
            aria-hidden
          />
          <div
            className="pointer-events-auto fixed left-0 transition-opacity duration-300"
            style={{
              top: spotlight.top,
              width: spotlight.left,
              height: spotlight.height,
              backgroundColor: dimBg,
              opacity: dim,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-auto fixed bottom-0 right-0 transition-opacity duration-300"
            style={{
              top: spotlight.top,
              left: spotlight.left + spotlight.width,
              backgroundColor: dimBg,
              opacity: dim,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-auto fixed bottom-0 left-0 right-0 transition-opacity duration-300"
            style={{
              top: spotlight.top + spotlight.height,
              backgroundColor: dimBg,
              opacity: dim,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute rounded-lg ring-2 ring-white/90 transition-all duration-300 ease-out"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              opacity: visible ? 1 : 0,
            }}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={cn(
          "pointer-events-auto rounded-xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-opacity duration-300 sm:p-5",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={tooltipStyle}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{t(step.titleKey)}</h2>
          </div>
          <button
            type="button"
            onClick={() => void finish()}
            disabled={saving}
            className="shrink-0 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            {t("onboarding.skip")}
          </button>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{t(step.descriptionKey)}</p>

        <div
          className={cn(
            "absolute h-0 w-0 border-[6px]",
            arrowClass
          )}
          aria-hidden
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" aria-label={t("onboarding.progress")}>
            {GUIDED_TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === stepIndex ? "w-6 bg-teal-500" : "w-2 bg-slate-300"
                )}
              />
            ))}
            <span className="ml-1 text-xs text-slate-500 tabular-nums">
              {t("onboarding.stepOf", { current: stepIndex + 1, total })}
            </span>
          </div>
          <Button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="rounded-lg bg-teal-500 px-5 font-semibold text-white hover:bg-teal-600"
          >
            {saving ? t("common.loading") : primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
