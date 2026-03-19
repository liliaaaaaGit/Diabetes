"use client"

import { useState } from "react"
import { MealEntry, MealType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { InsulinForm } from "./insulin-form"

interface MealFormProps {
  value: Partial<MealEntry>
  onChange: (value: Partial<MealEntry>) => void
}

export function MealForm({ value, onChange }: MealFormProps) {
  const { t } = useTranslation()
  const [logInsulin, setLogInsulin] = useState(false)

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.description")}
        </Label>
        <Input
          value={value.description || ""}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder={t("logbook.whatDidYouEat")}
        />
      </div>

      {/* Carbs */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.estimatedCarbs")} ({t("units.grams")})
        </Label>
        <Input
          type="number"
          value={value.carbsGrams || ""}
          onChange={(e) =>
            onChange({
              ...value,
              carbsGrams: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder="0"
        />
      </div>

      {/* Meal Type */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.mealType")}
        </Label>
        <Select
          value={value.mealType || "breakfast"}
          onValueChange={(v) => onChange({ ...value, mealType: v as MealType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">{t("logbook.breakfast")}</SelectItem>
            <SelectItem value="lunch">{t("logbook.lunch")}</SelectItem>
            <SelectItem value="dinner">{t("logbook.dinner")}</SelectItem>
            <SelectItem value="snack">{t("logbook.snack")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Insulin Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="logInsulin"
          checked={logInsulin}
          onChange={(e) => setLogInsulin(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <Label htmlFor="logInsulin" className="text-sm text-slate-600 cursor-pointer">
          {t("logbook.logInsulin")}
        </Label>
      </div>

      {/* Insulin Form (if toggled) */}
      {logInsulin && (
        <div className="pl-4 border-l-2 border-slate-200">
          <InsulinForm
            value={{}}
            onChange={(insulinValue) => {
              // This would need to be handled by parent component
              // For now, we just show the form
            }}
          />
        </div>
      )}

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
