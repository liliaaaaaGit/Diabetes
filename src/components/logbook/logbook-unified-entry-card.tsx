"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Annoyed,
  Droplet,
  Frown,
  Laugh,
  Meh,
  Smile,
  Syringe,
  UtensilsCrossed,
} from "lucide-react"
import type {
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  ActivityEntry,
  MoodEntry,
} from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/useTranslation"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import { cn } from "@/lib/utils"
import { glucoseValueTextClassMgDl } from "@/lib/glucose-range-style"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"
import { formatInsulin } from "@/lib/insulin-format"
import { formatMealCarbsLabel, hasAiMealEstimate, isPhotoMealEstimate } from "@/lib/meal-carbs"
import { MealConfidenceBadge } from "@/components/logbook/meal-confidence-badge"
import { MealDetailSheet } from "@/components/logbook/meal-detail-sheet"

const moodIcons: Record<number, LucideIcon> = {
  1: Annoyed,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

const rowIconClass = "h-4 w-4 shrink-0 text-slate-400"
const moodIconClass = "h-[18px] w-[18px] shrink-0 text-slate-400"

interface LogbookUnifiedEntryCardProps {
  entries: Entry[]
  onMealUpdated?: () => void
}

export function LogbookUnifiedEntryCard({ entries, onMealUpdated }: LogbookUnifiedEntryCardProps) {
  const { t, locale: appLocale } = useTranslation()
  const loc = appLocale === "en" ? "en" : "de"
  const { formatGlucoseWithUnit, targetRange } = useUserPreferences()
  const dateLocale = loc === "de" ? de : enUS
  const [expanded, setExpanded] = useState(false)
  const [mealDetail, setMealDetail] = useState<MealEntry | null>(null)

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const anchor = sorted[0]
  const timeLabel = format(parseISO(anchor.timestamp), "HH:mm", { locale: dateLocale })

  const notes = sorted.map((e) => e.note).filter(Boolean) as string[]
  const noteText = notes.join("\n\n")

  const glucoseList = sorted.filter((e) => e.type === "glucose") as GlucoseEntry[]
  const insulinList = sorted.filter((e) => e.type === "insulin") as InsulinEntry[]
  const mealList = sorted.filter((e) => e.type === "meal") as MealEntry[]
  const activityList = sorted.filter((e) => e.type === "activity") as ActivityEntry[]
  const moodList = sorted.filter((e) => e.type === "mood") as MoodEntry[]

  const showAiDisclaimer = mealList.some(hasAiMealEstimate)
  const showPhotoDisclaimer = mealList.some(isPhotoMealEstimate)

  return (
    <>
      <Card
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white shadow-sm",
          "transition-all hover:shadow-md"
        )}
      >
        <CardContent className="p-4">
          {showPhotoDisclaimer && (
            <p className="mb-1 text-[10px] leading-snug text-slate-500">{t("logbook.photoDisclaimer")}</p>
          )}
          {showAiDisclaimer && (
            <p className="mb-2 text-[10px] leading-snug text-slate-500">{t("logbook.aiCarbsDisclaimer")}</p>
          )}

          <p className="text-lg font-bold text-slate-900 tabular-nums">{timeLabel}</p>

          <div
            className="mt-2 flex flex-col gap-2"
            onClick={() => setExpanded(!expanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setExpanded(!expanded)
            }}
            role="button"
            tabIndex={0}
          >
            {glucoseList.map((g) => {
              const mg = glucoseEntryToMgDl(g)
              const formatted = formatGlucoseWithUnit(mg)
              return (
                <div key={g.id} className="flex items-center gap-2 text-base">
                  <Droplet className={rowIconClass} aria-hidden strokeWidth={2} />
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      glucoseValueTextClassMgDl(mg, targetRange.min, targetRange.max)
                    )}
                  >
                    {formatted.value} {formatted.suffix}
                  </span>
                </div>
              )
            })}

            {insulinList.map((ins) => (
              <div key={ins.id} className="flex items-center gap-2 text-base flex-wrap">
                <Syringe className={rowIconClass} aria-hidden strokeWidth={2} />
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatInsulin(ins.dose, loc)} {t("logbook.insulinUnitsAbbrev")}
                </span>
                {ins.insulinName ? (
                  <span className="text-sm text-slate-500">{ins.insulinName}</span>
                ) : null}
              </div>
            ))}

            {mealList.map((m) => {
              const carbsLabel = formatMealCarbsLabel(m, loc)
              if (!carbsLabel && !m.description) return null
              return (
                <button
                  key={m.id}
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-base min-h-[44px] -mx-1 px-1 rounded-lg hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMealDetail(m)
                  }}
                >
                  <UtensilsCrossed className={rowIconClass} aria-hidden strokeWidth={2} />
                  <span className="font-semibold text-slate-900 flex-1 min-w-0 truncate">
                    {carbsLabel ?? m.description}
                  </span>
                  <MealConfidenceBadge confidence={m.carbsConfidence} />
                </button>
              )
            })}

            {activityList.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-base">
                <Activity className={rowIconClass} aria-hidden strokeWidth={2} />
                <span className="font-medium text-slate-900">
                  {a.activityType} · {a.durationMinutes} {t("units.minutes")}
                </span>
              </div>
            ))}

            {moodList.map((m) => {
              const MoodIcon = moodIcons[m.moodValue] ?? Meh
              return (
                <div key={m.id} className="flex items-center gap-2 text-base">
                  <MoodIcon
                    className={moodIconClass}
                    aria-hidden
                    strokeWidth={1.5}
                    fill="none"
                    stroke="currentColor"
                  />
                </div>
              )
            })}
          </div>

          {noteText && expanded ? (
            <div className="mt-3 border-t border-slate-100 pt-2 text-sm text-slate-600 whitespace-pre-wrap break-words">
              {noteText}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <MealDetailSheet
        meal={mealDetail}
        open={mealDetail != null}
        onOpenChange={(open) => !open && setMealDetail(null)}
        onCorrected={() => {
          onMealUpdated?.()
          setMealDetail(null)
        }}
      />
    </>
  )
}
