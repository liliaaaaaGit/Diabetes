"use client"

import type { CarbConfidence } from "@/lib/types"
import { confidenceLabelKey } from "@/lib/meal-carbs"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

/**
 * Unified AI-confidence indicator used on every AI suggestion / estimate.
 *
 * One vocabulary everywhere: "Sicherheit: niedrig | mittel | hoch".
 * Always prefixed with the word "Sicherheit:" so it can never be misread as a
 * value (e.g. the old "hoch" badge next to "0 g KH" looked like a carb amount).
 * Rendered as small, neutral gray text — no colored pills, no percentages.
 */
export function ConfidenceIndicator({
  confidence,
  className,
}: {
  confidence?: CarbConfidence
  className?: string
}) {
  const { t } = useTranslation()
  if (!confidence) return null
  return (
    <span className={cn("text-[12px] leading-none text-gray-400", className)}>
      {t("logbook.confidencePrefix")}: {t(confidenceLabelKey(confidence))}
    </span>
  )
}

/** Backwards-compatible alias (older imports used MealConfidenceBadge). */
export const MealConfidenceBadge = ConfidenceIndicator
