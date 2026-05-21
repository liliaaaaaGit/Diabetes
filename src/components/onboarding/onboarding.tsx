"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, LineChart, MessageCircle, Droplet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const SLIDE_COUNT = 4

type SlideIcon = typeof Droplet

type SlideConfig = {
  icon: SlideIcon
  titleKey: string
  bodyKey: string
  primaryKey?: string
}

const SLIDES: SlideConfig[] = [
  {
    icon: Droplet,
    titleKey: "onboarding.slide1Title",
    bodyKey: "onboarding.slide1Body",
    primaryKey: "onboarding.slide1Cta",
  },
  {
    icon: BookOpen,
    titleKey: "onboarding.slide2Title",
    bodyKey: "onboarding.slide2Body",
  },
  {
    icon: MessageCircle,
    titleKey: "onboarding.slide3Title",
    bodyKey: "onboarding.slide3Body",
  },
  {
    icon: LineChart,
    titleKey: "onboarding.slide4Title",
    bodyKey: "onboarding.slide4Body",
    primaryKey: "onboarding.slide4Cta",
  },
]

interface OnboardingProps {
  onComplete?: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const finish = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboarding_completed: true }),
      })
      if (!res.ok) throw new Error("onboarding_save_failed")
      onComplete?.()
      router.push("/")
      router.refresh()
    } catch {
      toast({
        title: t("onboarding.saveFailed"),
        variant: "destructive",
      })
      setSaving(false)
    }
  }, [onComplete, router, saving, t, toast])

  const goNext = () => {
    if (index < SLIDE_COUNT - 1) setIndex((i) => i + 1)
    else void finish()
  }

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1)
  }

  const primaryLabel =
    index === 0
      ? t("onboarding.slide1Cta")
      : index === SLIDE_COUNT - 1
        ? t("onboarding.slide4Cta")
        : t("onboarding.next")

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const endX = e.changedTouches[0]?.clientX ?? start
    const delta = endX - start
    if (delta < -48) goNext()
    else if (delta > 48) goPrev()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col bg-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="flex shrink-0 items-center justify-end px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => void finish()}
          disabled={saving}
          className="text-sm font-medium text-slate-500 hover:text-teal-700 disabled:opacity-50"
        >
          {t("onboarding.skip")}
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => {
            const Icon = slide.icon
            return (
              <div
                key={slide.titleKey}
                className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center"
              >
                <div
                  className={cn(
                    "mb-8 flex h-20 w-20 items-center justify-center rounded-2xl",
                    i === 0 ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600 ring-1 ring-teal-100"
                  )}
                >
                  <Icon className="h-10 w-10" strokeWidth={1.75} aria-hidden />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {t(slide.titleKey)}
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">{t(slide.bodyKey)}</p>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="shrink-0 space-y-6 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-center justify-center gap-2" role="tablist" aria-label={t("onboarding.progress")}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              role="presentation"
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                i === index ? "w-6 bg-teal-500" : "w-2 bg-slate-300"
              )}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => (index < SLIDE_COUNT - 1 ? goNext() : void finish())}
            disabled={saving}
            className="min-w-[8.5rem] rounded-full bg-teal-500 px-8 font-semibold hover:bg-teal-600"
          >
            {saving ? t("common.loading") : primaryLabel}
          </Button>
        </div>
      </footer>
    </div>
  )
}
