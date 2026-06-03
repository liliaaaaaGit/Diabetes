"use client"

import { useEffect, useState } from "react"
import { GlucoseEntry, GlucoseUnit, GlucoseContext } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { GLUCOSE_RANGE, GLUCOSE_RANGE_MMOL } from "@/lib/constants"
import { glucoseUnitSuffix, mgDlToMmolL, mmolLToMgDl, storageUnitToDisplay } from "@/lib/glucose-units"

/** Call after a glucose entry was saved successfully to show a safety banner if needed. */
export function triggerGlucoseSafetyAfterSave(
  entry: Partial<GlucoseEntry>,
  showGlucoseSafetyIfNeeded: (entry: Partial<GlucoseEntry>) => void
): void {
  if (entry.type !== "glucose" || typeof entry.value !== "number") return
  showGlucoseSafetyIfNeeded({
    type: "glucose",
    value: entry.value,
    unit: entry.unit ?? "mg_dl",
  })
}

interface GlucoseFormProps {
  value: Partial<GlucoseEntry>
  onChange: (value: Partial<GlucoseEntry>) => void
}

export function GlucoseForm({ value, onChange }: GlucoseFormProps) {
  const { t } = useTranslation()
  const { preferredUnit } = useUserPreferences()
  const [unit, setUnit] = useState<GlucoseUnit>(value.unit || preferredUnit)
  const [glucoseValue, setGlucoseValue] = useState<string>(value.value?.toString() || "")
  const inputUnitSuffix = glucoseUnitSuffix(storageUnitToDisplay(unit))

  useEffect(() => {
    setUnit(preferredUnit)
  }, [preferredUnit])

  const handleValueChange = (newValue: string) => {
    setGlucoseValue(newValue)
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue)) {
      onChange({
        ...value,
        type: "glucose",
        value: numValue,
        unit,
      })
    }
  }

  const handleUnitChange = (newUnit: GlucoseUnit) => {
    const numValue = parseFloat(glucoseValue)
    if (!isNaN(numValue)) {
      const mgDl = unit === "mmol_l" ? mmolLToMgDl(numValue) : numValue
      const converted = newUnit === "mmol_l" ? mgDlToMmolL(mgDl) : mgDl
      const next = Number.isInteger(converted) ? String(converted) : converted.toFixed(1)
      setGlucoseValue(next)
      onChange({
        ...value,
        type: "glucose",
        value: parseFloat(next),
        unit: newUnit,
      })
    }
    setUnit(newUnit)
  }

  const isValid = () => {
    const numValue = parseFloat(glucoseValue)
    if (isNaN(numValue)) return false
    const range = unit === "mg_dl" ? GLUCOSE_RANGE : GLUCOSE_RANGE_MMOL
    return numValue >= range.min && numValue <= range.max
  }

  const rangeHint =
    unit === "mg_dl"
      ? `Wert muss zwischen ${GLUCOSE_RANGE.min} und ${GLUCOSE_RANGE.max} ${t("units.mgdl")} liegen`
      : `Wert muss zwischen ${GLUCOSE_RANGE_MMOL.min} und ${GLUCOSE_RANGE_MMOL.max} ${t("units.mmoll")} liegen`

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Label className="text-sm text-slate-600 mb-2 block">{t("logbook.value")}</Label>
        <div className="relative">
          <Input
            type="number"
            step={unit === "mmol_l" ? "0.1" : "1"}
            value={glucoseValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className="text-3xl font-bold text-center h-16 text-slate-900 pr-16"
            placeholder="0"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">
            {inputUnitSuffix}
          </span>
        </div>
        {!isValid() && glucoseValue && (
          <p className="text-xs text-red-500 mt-1">{rangeHint}</p>
        )}
      </div>

      <div>
        <Label className="text-sm text-slate-600 mb-2 block">{t("logbook.unit")}</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleUnitChange("mg_dl")}
            className={`flex-1 min-h-[44px] rounded-lg border px-3 py-2.5 text-sm ${
              unit === "mg_dl"
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {t("units.mgdl")}
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange("mmol_l")}
            className={`flex-1 min-h-[44px] rounded-lg border px-3 py-2.5 text-sm ${
              unit === "mmol_l"
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {t("units.mmoll")}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {t("settings.preferredUnit")}: {glucoseUnitSuffix(storageUnitToDisplay(preferredUnit))}
        </p>
      </div>

      <div>
        <Label className="text-sm text-slate-600 mb-2 block">{t("logbook.context")}</Label>
        <Select
          value={value.context || "other"}
          onValueChange={(v) => onChange({ ...value, context: v as GlucoseContext })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasting">{t("dashboard.fasting")}</SelectItem>
            <SelectItem value="pre_meal">{t("dashboard.beforeMeal")}</SelectItem>
            <SelectItem value="post_meal">{t("dashboard.afterMeal")}</SelectItem>
            <SelectItem value="bedtime">{t("dashboard.bedtime")}</SelectItem>
            <SelectItem value="other">{t("dashboard.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm text-slate-600 mb-2 block">{t("logbook.time")}</Label>
        <Input
          type="datetime-local"
          value={
            value.timestamp
              ? new Date(value.timestamp).toISOString().slice(0, 16)
              : new Date().toISOString().slice(0, 16)
          }
          onChange={(e) =>
            onChange({
              ...value,
              timestamp: new Date(e.target.value).toISOString(),
            })
          }
        />
      </div>

      <div>
        <Label className="text-sm text-slate-600 mb-2 block">{t("common.note")} (optional)</Label>
        <Textarea
          value={value.note || ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          placeholder={t("common.note")}
          rows={3}
        />
      </div>
    </div>
  )
}
