"use client"

import { MoodEntry, MoodValue } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

interface MoodFormProps {
  value: Partial<MoodEntry>
  onChange: (value: Partial<MoodEntry>) => void
}

export function MoodForm({ value, onChange }: MoodFormProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Mood Selection */}
      <div>
        <Label className="text-sm text-slate-600 mb-4 block text-center">
          {t("common.mood")}
        </Label>
        <div className="flex items-center justify-center gap-4">
          {([1, 2, 3, 4, 5] as MoodValue[]).map((moodValue) => (
            <button
              key={moodValue}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  type: "mood",
                  moodValue,
                })
              }
              className={cn(
                "text-4xl transition-all duration-200 rounded-full p-2",
                value.moodValue === moodValue
                  ? "scale-125 ring-4 ring-blue-500 ring-offset-2"
                  : "hover:scale-110"
              )}
            >
              {moodEmojis[moodValue]}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.howAreYou")}
        </Label>
        <Textarea
          value={value.note || ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          placeholder={t("logbook.howAreYou")}
          rows={4}
        />
      </div>

      {/* Time */}
      <div>
        <Label className="text-sm text-slate-600 mb-2 block">
          {t("logbook.time")}
        </Label>
        <input
          type="datetime-local"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
    </div>
  )
}
