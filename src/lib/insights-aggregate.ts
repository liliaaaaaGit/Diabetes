import { eachDayOfInterval, startOfDay, subDays, subMonths, format } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"
import type {
  Conversation,
  ConversationEmotions,
  Entry,
  GlucoseEntry,
  InsulinEntry,
  MealEntry,
  MoodEntry,
} from "@/lib/types"

export type InsightsTimeRangeKey = "7d" | "30d" | "3m"

export function computeInsightsRange(tr: InsightsTimeRangeKey): { from: Date; to: Date } {
  const now = new Date()
  if (tr === "7d") {
    return { from: startOfDay(subDays(now, 6)), to: now }
  }
  if (tr === "30d") {
    return { from: startOfDay(subDays(now, 29)), to: now }
  }
  return { from: startOfDay(subMonths(now, 3)), to: now }
}

export function glucoseMgDl(g: GlucoseEntry): number {
  return g.unit === "mmol_l" ? g.value * 18.0182 : g.value
}

/**
 * Map 6-dimensional conversation emotions to a single 1–5 mood score.
 */
export function emotionsToMood1to5(e: ConversationEmotions): number {
  const pos = e.happiness * 1.1 + e.surprise * 0.45
  const neg = e.sadness * 1.1 + e.anger + e.fear + e.disgust * 0.55
  const raw = 3 + 2 * (pos - neg)
  return Math.round(Math.max(1, Math.min(5, raw)))
}

export type DailyMoodGlucosePoint = {
  dateKey: string
  label: string
  avgGlucose: number | null
  mood: number | null
}

function dayKeyFromIso(iso: string): string {
  return iso.slice(0, 10)
}

export function buildDailyMoodGlucosePoints(
  range: { from: Date; to: Date },
  entries: Entry[],
  conversations: Conversation[],
  locale: "de" | "en" = "de"
): DailyMoodGlucosePoint[] {
  const dateLocale = locale === "de" ? de : enUS
  const start = startOfDay(range.from)
  const end = startOfDay(range.to)
  const days = eachDayOfInterval({ start, end })

  const glucose = entries.filter((e) => e.type === "glucose") as GlucoseEntry[]
  const moods = entries.filter((e) => e.type === "mood") as MoodEntry[]

  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd")
    const label = format(day, locale === "de" ? "EEE d." : "EEE d", { locale: dateLocale })

    const dayGlucose = glucose.filter((g) => dayKeyFromIso(g.timestamp) === key)
    const avgGlucose =
      dayGlucose.length > 0
        ? Math.round(
            (dayGlucose.reduce((s, g) => s + glucoseMgDl(g), 0) / dayGlucose.length) * 10
          ) / 10
        : null

    const moodVals: number[] = []
    for (const m of moods) {
      if (dayKeyFromIso(m.timestamp) === key) moodVals.push(m.moodValue)
    }

    for (const c of conversations) {
      if (c.isActive) continue
      const when = c.endedAt || c.startedAt
      if (!when || dayKeyFromIso(when) !== key) continue
      if (c.emotions) moodVals.push(emotionsToMood1to5(c.emotions))
    }

    const mood =
      moodVals.length > 0
        ? Math.round((moodVals.reduce((a, b) => a + b, 0) / moodVals.length) * 10) / 10
        : null

    return { dateKey: key, label, avgGlucose, mood }
  })
}

export function sumInsulinUnits(entries: Entry[]): number {
  return (entries.filter((e) => e.type === "insulin") as InsulinEntry[]).reduce(
    (s, e) => s + e.dose,
    0
  )
}

export function sumCarbsGrams(entries: Entry[]): number {
  return (entries.filter((e) => e.type === "meal") as MealEntry[]).reduce(
    (s, e) => s + (e.carbsGrams ?? 0),
    0
  )
}

export function averageGlucoseMgDl(entries: GlucoseEntry[]): number | null {
  if (entries.length === 0) return null
  const sum = entries.reduce((s, g) => s + glucoseMgDl(g), 0)
  return Math.round((sum / entries.length) * 10) / 10
}

export function glucoseTirPercents(entries: GlucoseEntry[]): {
  under: number
  inRange: number
  over: number
} {
  if (entries.length === 0) return { under: 0, inRange: 0, over: 0 }
  const n = entries.length
  let under = 0
  let inn = 0
  let over = 0
  for (const e of entries) {
    const v = glucoseMgDl(e)
    if (v < 70) under++
    else if (v <= 180) inn++
    else over++
  }
  return {
    under: Math.round((under / n) * 100),
    inRange: Math.round((inn / n) * 100),
    over: Math.round((over / n) * 100),
  }
}

/** Average glucose in clinical band 70–180 mg/dL → green (matches TIR „im Ziel“). */
export function averageGlucoseLabelClass(avgMgDl: number | null): string {
  if (avgMgDl == null) return "text-slate-400"
  if (avgMgDl >= 70 && avgMgDl <= 180) return "text-green-600"
  if (avgMgDl >= 60 && avgMgDl < 70) return "text-amber-600"
  if (avgMgDl > 180 && avgMgDl <= 250) return "text-amber-600"
  return "text-red-600"
}
