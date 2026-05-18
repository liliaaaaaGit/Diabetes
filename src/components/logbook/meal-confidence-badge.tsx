"use client"

import type { CarbConfidence } from "@/lib/types"
import { confidenceBadgeClass, confidenceLabelKey } from "@/lib/meal-carbs"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

export function MealConfidenceBadge({
  confidence,
  className,
}: {
  confidence?: CarbConfidence
  className?: string
}) {
  const { t } = useTranslation()
  if (!confidence) return null
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
        confidenceBadgeClass(confidence),
        className
      )}
    >
      {t(confidenceLabelKey(confidence))}
    </span>
  )
}
