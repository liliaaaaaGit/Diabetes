"use client"

import { useState } from "react"
import { ActivityEntry, Intensity } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityFormProps {
  value: Partial<ActivityEntry>
  onChange: (value: Partial<ActivityEntry>) => void
}

export function ActivityForm({ value, onChange }: ActivityFormProps) {
  const { t } = useTranslation()
  const [duration, setDuration] = useState<string>(
    (value.durationMinutes || 0).toString()
  )

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration)
    const numDuration = parseInt(newDuration)
    if (!isNaN(numDuration)) {
      onChange({
        ...value,
        type: "activity",
        durationMinutes: numDuration,
      })
    }
  }

  const adjustDuration = (delta: number) => {
    const current = parseInt(duration) || 0
    const newDuration = Math.max(0, current + delta)
    handleDurationChange(newDuration.toString())
  }

  return (
    <div className="space-y-6">
      {/* Activity Type */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.activity")}
        </Label>
        <Input
          value={value.activityType || ""}
          onChange={(e) => onChange({ ...value, activityType: e.target.value })}
          placeholder={t("logbook.whatDidYouDo")}
        />
      </div>

      {/* Duration */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.duration")} ({t("units.minutes")})
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => adjustDuration(-5)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            step="5"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="text-center text-xl font-semibold flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => adjustDuration(5)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Intensity */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.intensity")}
        </Label>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as Intensity[]).map((intensity) => (
            <Button
              key={intensity}
              type="button"
              variant={value.intensity === intensity ? "default" : "outline"}
              className={cn("flex-1")}
              onClick={() => onChange({ ...value, intensity })}
            >
              {intensity === "low" && t("logbook.low")}
              {intensity === "medium" && t("logbook.medium")}
              {intensity === "high" && t("logbook.high")}
            </Button>
          ))}
        </div>
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
