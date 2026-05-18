"use client"

import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SafetyBannerLevel } from "@/lib/glucose-safety"
import { useTranslation } from "@/hooks/useTranslation"

export const SAFETY_BANNER_AUTO_DISMISS_MS = 15_000

export interface SafetyBannerProps {
  level: SafetyBannerLevel
  title: string
  body: string
  onClose: () => void
}

const levelStyles: Record<SafetyBannerLevel, string> = {
  danger: "border-red-300 bg-red-50 text-red-950",
  warn: "border-amber-300 bg-amber-50 text-amber-950",
}

const iconStyles: Record<SafetyBannerLevel, string> = {
  danger: "text-red-600",
  warn: "text-amber-600",
}

export function SafetyBanner({ level, title, body, onClose }: SafetyBannerProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "pointer-events-auto fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border p-4 shadow-lg relative",
        levelStyles[level]
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle className={cn("mt-0.5 h-5 w-5 shrink-0", iconStyles[level])} aria-hidden />
        <div className="min-w-0 flex-1 space-y-1 pr-6">
          <p className="font-semibold leading-snug">{title}</p>
          <p className="text-sm leading-relaxed opacity-90">{body}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
