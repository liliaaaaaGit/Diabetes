"use client"

import { useState } from "react"
import {
  Droplet,
  Syringe,
  UtensilsCrossed,
  Activity,
  Heart,
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

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

function glucoseMgDl(e: GlucoseEntry): number {
  return e.unit === "mmol_l" ? e.value * 18.0182 : e.value
}

interface ConsolidatedEntryCardProps {
  entries: Entry[]
}

export function ConsolidatedEntryCard({ entries }: ConsolidatedEntryCardProps) {
  const { t, locale } = useTranslation()
  const dateLocale = locale === "de" ? de : enUS
  const [expanded, setExpanded] = useState(false)

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

  return (
    <Card
      className={cn(
        "rounded-xl border-slate-200 shadow-sm cursor-pointer transition-all hover:shadow-md"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="text-lg font-semibold text-slate-900 tabular-nums shrink-0">{timeLabel}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm flex-1 min-w-0">
            {glucoseList.map((g) => {
              const mg = glucoseMgDl(g)
              const unit = g.unit === "mg_dl" ? t("units.mgdl") : t("units.mmoll")
              const displayVal = g.unit === "mg_dl" ? g.value : g.value
              return (
                <div key={g.id} className="flex items-center gap-1.5">
                  <Droplet className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
                  <span className={cn("font-semibold tabular-nums", glucoseValueTextClassMgDl(mg))}>
                    {displayVal} {unit}
                  </span>
                </div>
              )
            })}
            {insulinList.map((ins) => (
              <div key={ins.id} className="flex items-center gap-1.5">
                <Syringe className="h-4 w-4 text-purple-600 shrink-0" aria-hidden />
                <span className="font-semibold text-slate-900 tabular-nums">
                  {ins.dose} {t("units.units")}
                </span>
              </div>
            ))}
            {mealList.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 min-w-0">
                <UtensilsCrossed className="h-4 w-4 text-orange-600 shrink-0" aria-hidden />
                <span className="font-medium text-slate-900 truncate">
                  {m.carbsGrams != null ? (
                    <>
                      {m.carbsGrams}g {t("dashboard.carbs")}
                    </>
                  ) : (
                    m.description
                  )}
                </span>
              </div>
            ))}
            {activityList.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 min-w-0">
                <Activity className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
                <span className="font-medium text-slate-900 truncate">
                  {a.activityType} · {a.durationMinutes} {t("units.minutes")}
                </span>
              </div>
            ))}
            {moodList.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600 shrink-0" aria-hidden />
                <span className="text-xl leading-none">{moodEmojis[m.moodValue]}</span>
              </div>
            ))}
          </div>
        </div>
        {noteText ? (
          <div
            className={cn(
              "mt-3 text-sm text-slate-600 overflow-hidden transition-all border-t border-slate-100 pt-2",
              expanded ? "max-h-none" : "max-h-5 line-clamp-1"
            )}
          >
            {noteText}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
