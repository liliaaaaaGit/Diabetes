"use client"

import { useState } from "react"
import type { MealEntry } from "@/lib/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/useTranslation"
import { formatMealCarbsLabel, hasAiMealEstimate } from "@/lib/meal-carbs"
import { MealConfidenceBadge } from "@/components/logbook/meal-confidence-badge"

interface MealDetailSheetProps {
  meal: MealEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCorrected?: (meal: MealEntry) => void
}

export function MealDetailSheet({ meal, open, onOpenChange, onCorrected }: MealDetailSheetProps) {
  const { t, locale } = useTranslation()
  const [correctOpen, setCorrectOpen] = useState(false)
  const [correctValue, setCorrectValue] = useState("")
  const [saving, setSaving] = useState(false)

  if (!meal) return null

  const loc = locale === "en" ? "en" : "de"
  const carbsLabel = formatMealCarbsLabel(meal, loc)

  const handleSaveCorrection = async () => {
    const n = Number(correctValue)
    if (!Number.isFinite(n) || n < 0 || n > 500) return
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${meal.id}/meal-correction`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctedKh: Math.round(n) }),
      })
      if (!res.ok) throw new Error("save failed")
      const json = (await res.json()) as { entry: MealEntry }
      onCorrected?.(json.entry)
      setCorrectOpen(false)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{meal.description}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {carbsLabel && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">{carbsLabel}</span>
              <MealConfidenceBadge confidence={meal.carbsConfidence} />
            </div>
          )}

          {hasAiMealEstimate(meal) && (
            <p className="text-xs leading-relaxed text-slate-500">{t("logbook.aiCarbsDisclaimer")}</p>
          )}

          {meal.components && meal.components.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-800 mb-2">{t("logbook.mealComponentsTitle")}</p>
              <ul className="space-y-2 text-sm text-slate-700">
                {meal.components.map((c, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                    <span>
                      {c.name}
                      {c.estimatedAmount ? (
                        <span className="block text-xs text-slate-500">{c.estimatedAmount}</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums shrink-0">{c.kh_g} g KH</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meal.fatProteinNote && (
            <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-950 leading-relaxed">
              {meal.fatProteinNote}
            </p>
          )}

          {meal.extractionNote && (
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-medium">{t("logbook.extractionNoteLabel")}: </span>
              {meal.extractionNote}
            </p>
          )}

          {!correctOpen ? (
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => {
                setCorrectValue(
                  String(meal.userCorrectedKh ?? meal.carbsGrams ?? meal.carbsMinGrams ?? "")
                )
                setCorrectOpen(true)
              }}
            >
              {t("logbook.correctCarbs")}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <Label htmlFor="correct-kh">{t("logbook.correctCarbsLabel")}</Label>
              <Input
                id="correct-kh"
                type="number"
                inputMode="decimal"
                value={correctValue}
                onChange={(e) => setCorrectValue(e.target.value)}
                className="min-h-[44px]"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => setCorrectOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 min-h-[44px]"
                  disabled={saving}
                  onClick={() => void handleSaveCorrection()}
                >
                  {saving ? t("common.loading") : t("common.save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
