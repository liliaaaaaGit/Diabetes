"use client"

import { useState } from "react"
import type { MealType, NewEntry } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseUnitSuffix, storageUnitToDisplay } from "@/lib/glucose-units"
import { roundInsulinDose } from "@/lib/insulin-format"
import { Loader2 } from "lucide-react"

/**
 * Fast manual entry — NO AI round-trip.
 *
 * The user types only the fields they have (blood glucose, carbs, bolus) and the
 * time, then taps "Speichern". Each filled field becomes its own entry in the
 * database (source = "manual"), all sharing the same timestamp.
 *
 * Goal: from open to saved in under 10 seconds, with zero AI wait time.
 */

type TimeOption = "now" | "15" | "30" | "60" | "custom"

interface QuickEntryFormProps {
  /** Pre-fills the insulin name (user's most recent bolus, e.g. "NovoRapid"). */
  defaultBolusName?: string
  /** Saves the built entries. Parent writes them to the DB and refetches. */
  onSubmit: (entries: NewEntry[]) => Promise<void>
  onCancel?: () => void
}

/** Pick a sensible meal label based on the time of day (purely cosmetic). */
function inferMealType(date: Date): MealType {
  const h = date.getHours()
  if (h < 11) return "breakfast"
  if (h < 15) return "lunch"
  if (h < 22) return "dinner"
  return "snack"
}

export function QuickEntryForm({ defaultBolusName, onSubmit, onCancel }: QuickEntryFormProps) {
  const { t } = useTranslation()
  const { preferredUnit } = useUserPreferences()
  const unitSuffix = glucoseUnitSuffix(storageUnitToDisplay(preferredUnit))

  const [bg, setBg] = useState("")
  const [carbs, setCarbs] = useState("")
  const [bolus, setBolus] = useState("")
  const [timeOption, setTimeOption] = useState<TimeOption>("now")
  const [customTime, setCustomTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Compute the timestamp from the selected quick option. */
  const resolveTimestamp = (): string => {
    if (timeOption === "custom") return new Date(customTime).toISOString()
    const now = new Date()
    const minutesAgo = timeOption === "now" ? 0 : Number(timeOption)
    return new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString()
  }

  const parseNum = (raw: string): number | null => {
    const n = parseFloat(raw.replace(",", "."))
    return Number.isFinite(n) ? n : null
  }

  const bgNum = parseNum(bg)
  const carbsNum = parseNum(carbs)
  const bolusNum = parseNum(bolus)
  const hasAtLeastOne = bgNum != null || carbsNum != null || bolusNum != null

  const handleSave = async () => {
    setError(null)
    if (!hasAtLeastOne) {
      setError(t("logbook.quickAtLeastOne"))
      return
    }

    const timestamp = resolveTimestamp()
    const entries: NewEntry[] = []

    if (bgNum != null) {
      entries.push({
        type: "glucose",
        source: "manual",
        timestamp,
        value: bgNum,
        unit: preferredUnit,
        context: "other",
      } as NewEntry)
    }

    if (carbsNum != null) {
      entries.push({
        type: "meal",
        source: "manual",
        timestamp,
        description: t("logbook.quickCarbsLabel"),
        mealType: inferMealType(new Date(timestamp)),
        // Manual entries store an exact point value (the user typed it).
        carbsGrams: carbsNum,
        estimated: false,
        mealSource: "manual",
      } as NewEntry)
    }

    if (bolusNum != null && bolusNum > 0) {
      entries.push({
        type: "insulin",
        source: "manual",
        timestamp,
        dose: roundInsulinDose(bolusNum),
        insulinType: "rapid",
        insulinName: defaultBolusName || undefined,
      } as NewEntry)
    }

    if (entries.length === 0) {
      setError(t("logbook.quickAtLeastOne"))
      return
    }

    setSaving(true)
    try {
      await onSubmit(entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("logbook.quickSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  // 48px+ touch targets; numeric keyboard on mobile via inputMode.
  const fieldInputClass = "h-12 text-lg"

  const timeOptions: { key: TimeOption; label: string }[] = [
    { key: "now", label: t("logbook.quickTimeNow") },
    { key: "15", label: t("logbook.quickTime15") },
    { key: "30", label: t("logbook.quickTime30") },
    { key: "60", label: t("logbook.quickTime60") },
  ]

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">{t("logbook.quickHint")}</p>

      {/* Blood glucose */}
      <div>
        <Label className="text-sm text-slate-600 mb-1.5 block">{t("common.glucose")}</Label>
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            placeholder="—"
            className={`${fieldInputClass} pr-16`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {unitSuffix}
          </span>
        </div>
      </div>

      {/* Carbohydrates */}
      <div>
        <Label className="text-sm text-slate-600 mb-1.5 block">{t("logbook.carbsLabel")}</Label>
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="—"
            className={`${fieldInputClass} pr-12`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            g
          </span>
        </div>
      </div>

      {/* Bolus insulin */}
      <div>
        <Label className="text-sm text-slate-600 mb-1.5 block">
          {t("logbook.bolusLabel")}
          {defaultBolusName ? (
            <span className="ml-1 font-normal text-slate-400">({defaultBolusName})</span>
          ) : null}
        </Label>
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            value={bolus}
            onChange={(e) => setBolus(e.target.value)}
            placeholder="—"
            className={`${fieldInputClass} pr-12`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {t("logbook.insulinUnitsAbbrev")}
          </span>
        </div>
      </div>

      {/* Time */}
      <div>
        <Label className="text-sm text-slate-600 mb-1.5 block">{t("logbook.time")}</Label>
        <div className="flex flex-wrap gap-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTimeOption(opt.key)}
              className={`min-h-[44px] rounded-lg border px-3 text-sm ${
                timeOption === opt.key
                  ? "border-teal-500 bg-teal-50 text-teal-800"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTimeOption("custom")}
            className={`min-h-[44px] rounded-lg border px-3 text-sm ${
              timeOption === "custom"
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {t("logbook.quickTimeCustom")}
          </button>
        </div>
        {timeOption === "custom" && (
          <Input
            type="datetime-local"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="mt-2 h-12"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 border-t pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="min-h-[48px] flex-1" disabled={saving}>
            {t("common.cancel")}
          </Button>
        )}
        <Button
          onClick={() => void handleSave()}
          className="min-h-[48px] flex-1"
          disabled={saving || !hasAtLeastOne}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("logbook.savingEntries")}
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </div>
    </div>
  )
}
