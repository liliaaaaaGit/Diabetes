"use client"

import { useState } from "react"
import { InsulinEntry, InsulinType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { Minus, Plus } from "lucide-react"

interface InsulinFormProps {
  value: Partial<InsulinEntry>
  onChange: (value: Partial<InsulinEntry>) => void
}

export function InsulinForm({ value, onChange }: InsulinFormProps) {
  const { t } = useTranslation()
  const [dose, setDose] = useState<string>((value.dose || 0).toString())

  const handleDoseChange = (newDose: string) => {
    setDose(newDose)
    const numDose = parseFloat(newDose)
    if (!isNaN(numDose)) {
      onChange({
        ...value,
        type: "insulin",
        dose: numDose,
      })
    }
  }

  const adjustDose = (delta: number) => {
    const current = parseFloat(dose) || 0
    const newDose = Math.max(0, current + delta)
    handleDoseChange(newDose.toFixed(1))
  }

  return (
    <div className="space-y-6">
      {/* Dose */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.dose")} ({t("units.units")})
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => adjustDose(-0.5)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            step="0.5"
            value={dose}
            onChange={(e) => handleDoseChange(e.target.value)}
            className="text-center text-2xl font-semibold flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => adjustDose(0.5)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Insulin Type */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.insulinType")}
        </Label>
        <Select
          value={value.insulinType || "rapid"}
          onValueChange={(v) =>
            onChange({ ...value, insulinType: v as InsulinType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rapid">{t("logbook.rapid")}</SelectItem>
            <SelectItem value="long_acting">{t("logbook.longActing")}</SelectItem>
            <SelectItem value="mixed">{t("logbook.mixed")}</SelectItem>
            <SelectItem value="other">{t("logbook.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insulin Name */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.insulinName")} (optional)
        </Label>
        <Input
          value={value.insulinName || ""}
          onChange={(e) => onChange({ ...value, insulinName: e.target.value })}
          placeholder="z.B. NovoRapid"
        />
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
