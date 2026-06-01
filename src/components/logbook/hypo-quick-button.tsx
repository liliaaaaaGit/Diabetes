"use client"

import { useState } from "react"
import { CandyCane } from "lucide-react"
import type { NewEntry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTranslation } from "@/hooks/useTranslation"

/** Standard fast-carb hypo treatment doses (grams). */
const HYPO_DOSES = [10, 15, 20]

interface HypoQuickButtonProps {
  /** Saves the built hypo-treatment meal entry. */
  onSave: (entries: NewEntry[]) => Promise<void>
}

/**
 * One-tap hypo treatment logger (P2.1).
 *
 * Designed for shaky hands during a low: no typing, just pick 10 / 15 / 20 g.
 * Saves immediately as a manual meal entry labelled "Hypo-Behandlung".
 */
export function HypoQuickButton({ onSave }: HypoQuickButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePick = async (grams: number) => {
    setSaving(true)
    try {
      const entry: NewEntry = {
        type: "meal",
        source: "manual",
        timestamp: new Date().toISOString(),
        description: t("logbook.hypoTreatment"),
        mealType: "snack",
        carbsGrams: grams,
        estimated: false,
        mealSource: "manual",
      } as NewEntry
      await onSave([entry])
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-[44px] gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
      >
        <CandyCane className="h-4 w-4" />
        {t("logbook.hypoButton")}
      </Button>

      <Sheet open={open} onOpenChange={(v) => !saving && setOpen(v)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">{t("logbook.hypoButton")}</SheetTitle>
          </SheetHeader>
          <p className="mt-1 text-sm text-slate-500">{t("logbook.hypoHint")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {HYPO_DOSES.map((grams) => (
              <button
                key={grams}
                type="button"
                disabled={saving}
                onClick={() => void handlePick(grams)}
                className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-2 border-rose-200 bg-rose-50 text-rose-800 active:scale-95 disabled:opacity-60"
              >
                <span className="text-3xl font-bold tabular-nums">{grams}</span>
                <span className="text-sm">g KH</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
