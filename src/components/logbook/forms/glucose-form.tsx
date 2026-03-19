"use client"

import { useState } from "react"
import { GlucoseEntry, GlucoseUnit, GlucoseContext } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { GLUCOSE_RANGE, GLUCOSE_RANGE_MMOL } from "@/lib/constants"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GlucoseFormProps {
  value: Partial<GlucoseEntry>
  onChange: (value: Partial<GlucoseEntry>) => void
}

export function GlucoseForm({ value, onChange }: GlucoseFormProps) {
  const { t } = useTranslation()
  const [unit, setUnit] = useState<GlucoseUnit>(value.unit || "mg_dl")
  const [glucoseValue, setGlucoseValue] = useState<string>(
    value.value?.toString() || ""
  )

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
    setUnit(newUnit)
    const numValue = parseFloat(glucoseValue)
    if (!isNaN(numValue)) {
      onChange({
        ...value,
        type: "glucose",
        value: numValue,
        unit: newUnit,
      })
    }
  }

  const isValid = () => {
    const numValue = parseFloat(glucoseValue)
    if (isNaN(numValue)) return false
    const range = unit === "mg_dl" ? GLUCOSE_RANGE : GLUCOSE_RANGE_MMOL
    return numValue >= range.min && numValue <= range.max
  }

  return (
    <div className="space-y-6">
      {/* Value Input */}
      <div className="text-center">
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.value")}
        </Label>
        <Input
          type="number"
          value={glucoseValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="text-3xl font-bold text-center h-16 text-slate-900"
          placeholder="0"
        />
        {!isValid() && glucoseValue && (
          <p className="text-xs text-red-500 mt-1">
            {unit === "mg_dl"
              ? `Wert muss zwischen ${GLUCOSE_RANGE.min} und ${GLUCOSE_RANGE.max} mg/dL liegen`
              : `Wert muss zwischen ${GLUCOSE_RANGE_MMOL.min} und ${GLUCOSE_RANGE_MMOL.max} mmol/L liegen`}
          </p>
        )}
      </div>

      {/* Unit Toggle */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.unit")}
        </Label>
        <Tabs value={unit} onValueChange={(v) => handleUnitChange(v as GlucoseUnit)}>
          <TabsList className="w-full">
            <TabsTrigger value="mg_dl" className="flex-1">
              {t("units.mgdl")}
            </TabsTrigger>
            <TabsTrigger value="mmol_l" className="flex-1">
              {t("units.mmoll")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Context */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.context")}
        </Label>
        <Select
          value={value.context || "other"}
          onValueChange={(v) =>
            onChange({ ...value, context: v as GlucoseContext })
          }
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

      {/* Time */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.time")}
        </Label>
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

      {/* Note */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("common.note")} (optional)
        </Label>
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
