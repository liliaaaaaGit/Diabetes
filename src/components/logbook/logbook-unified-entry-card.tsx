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

function glucoseMgDl(g: GlucoseEntry): number {
  return g.unit === "mmol_l" ? g.value * 18.0182 : g.value
}

/** Nur Umriss-Gesichter, alles in Grau – kein Emoji-Look. */
const moodIcons: Record<number, LucideIcon> = {
  1: Annoyed,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

const rowIconClass = "h-4 w-4 shrink-0 text-slate-400"
/** Etwas feinerer Strich = klarer „Outline“-Charakter für Stimmung */
const moodIconClass = "h-[18px] w-[18px] shrink-0 text-slate-400"

interface LogbookUnifiedEntryCardProps {
  entries: Entry[]
}

/**
 * Einheitliche Tagesbuch-Karte: Uhrzeit oben links, darunter BZ → Insulin → KH (graue Icons, nur wenn vorhanden).
 */
export function LogbookUnifiedEntryCard({ entries }: LogbookUnifiedEntryCardProps) {
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
        "w-full rounded-xl border border-slate-200 bg-white shadow-sm",
        "cursor-pointer transition-all hover:shadow-md"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <p className="text-lg font-bold text-slate-900 tabular-nums">{timeLabel}</p>

        <div className="mt-2 flex flex-col gap-2">
          {glucoseList.map((g) => {
            const mg = glucoseMgDl(g)
            const display = Math.round(mg)
            return (
              <div key={g.id} className="flex items-center gap-2 text-base">
                <Droplet className={rowIconClass} aria-hidden strokeWidth={2} />
                <span
                  className={cn("font-semibold tabular-nums", glucoseValueTextClassMgDl(mg))}
                >
                  {display} {t("units.mgdl")}
                </span>
              </div>
            )
          })}

          {insulinList.map((ins) => (
            <div key={ins.id} className="flex items-center gap-2 text-base flex-wrap">
              <Syringe className={rowIconClass} aria-hidden strokeWidth={2} />
              <span className="font-semibold text-slate-900 tabular-nums">
                {ins.dose % 1 === 0 ? ins.dose : ins.dose.toFixed(1)} {t("units.units")}
              </span>
              {ins.insulinName ? (
                <span className="text-sm text-slate-500">{ins.insulinName}</span>
              ) : null}
            </div>
          ))}

          {mealList.map((m) => {
            const grams = m.carbsGrams
            if (grams == null || grams <= 0) return null
            return (
              <div key={m.id} className="flex items-center gap-2 text-base">
                <UtensilsCrossed className={rowIconClass} aria-hidden strokeWidth={2} />
                <span className="font-semibold text-slate-900 tabular-nums">
                  {grams % 1 === 0 ? grams : grams.toFixed(1)} g
                </span>
              </div>
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
  )
}
