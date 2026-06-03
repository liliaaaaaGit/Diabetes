"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { formatCarbsGrams, formatMealCarbsLabel, hasAiMealEstimate } from "@/lib/meal-carbs"
import { MealConfidenceBadge } from "@/components/logbook/meal-confidence-badge"
import { deleteEntry, updateEntryNote } from "@/lib/db-client"

interface MealDetailSheetProps {
  meal: MealEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCorrected?: (meal: MealEntry) => void
}

export function MealDetailSheet({ meal, open, onOpenChange, onCorrected }: MealDetailSheetProps) {
  const { t, locale } = useTranslation()
  const { userId } = useUser()
  const { toast } = useToast()
  const [correctOpen, setCorrectOpen] = useState(false)
  const [correctValue, setCorrectValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState("")
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    setNote(meal?.note ?? "")
    setConfirmingDelete(false)
    setCorrectOpen(false)
  }, [meal])

  if (!meal) return null

  const handleSaveNote = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await updateEntryNote(userId, meal.id, note)
      toast({ title: t("logbook.noteSaved") })
      onCorrected?.(meal)
    } catch (e) {
      toast({
        title: t("logbook.noteSaveFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await deleteEntry(userId, meal.id)
      toast({ title: t("logbook.entryDeleted") })
      onCorrected?.(meal)
    } catch (e) {
      toast({
        title: t("logbook.entryDeleteFailed"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

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
                    <span className="tabular-nums shrink-0">{formatCarbsGrams(c.kh_g, loc)}</span>
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

          {/* Free-text note (P2.3). */}
          <div>
            <Label htmlFor="meal-note" className="text-sm text-slate-600 mb-1.5 block">
              {t("common.note")}
            </Label>
            <Textarea
              id="meal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("logbook.notePlaceholder")}
              rows={2}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full min-h-[44px]"
              disabled={saving}
              onClick={() => void handleSaveNote()}
            >
              {t("logbook.saveNote")}
            </Button>
          </div>

          {/* Delete (with confirmation). */}
          {!confirmingDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-[44px] text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={saving}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("logbook.deleteEntry")}
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{t("logbook.deleteConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  disabled={saving}
                  onClick={() => setConfirmingDelete(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  className="flex-1 min-h-[44px] bg-red-600 hover:bg-red-700"
                  disabled={saving}
                  onClick={() => void handleDelete()}
                >
                  {t("logbook.deleteEntry")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
