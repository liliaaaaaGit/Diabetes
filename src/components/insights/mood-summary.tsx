"use client"

import { MoodEntry } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { parseISO, subDays, isAfter } from "date-fns"
import { cn } from "@/lib/utils"

interface MoodSummaryProps {
  entries: MoodEntry[]
  days: number
}

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

const moodLabels: Record<number, string> = {
  1: "Sehr schlecht",
  2: "Schlecht",
  3: "Neutral",
  4: "Gut",
  5: "Sehr gut",
}

export function MoodSummary({ entries, days }: MoodSummaryProps) {
  const { t } = useTranslation()
  const cutoffDate = subDays(new Date(), days)
  const midPoint = subDays(new Date(), days / 2)

  const filteredEntries = entries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp)
    return entryDate >= cutoffDate
  })

  if (filteredEntries.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">{t("empty.moodSummaryEmpty")}</p>
    )
  }

  const thisWeekEntries = filteredEntries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp)
    return isAfter(entryDate, midPoint)
  })

  const lastWeekEntries = filteredEntries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp)
    return !isAfter(entryDate, midPoint)
  })

  // Most common mood
  const moodCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  filteredEntries.forEach((entry) => {
    moodCounts[entry.moodValue]++
  })
  const mostCommonMood = Object.entries(moodCounts).reduce((a, b) =>
    moodCounts[parseInt(a[0])] > moodCounts[parseInt(b[0])] ? a : b
  )[0]

  // Trend
  const thisWeekAvg =
    thisWeekEntries.length > 0
      ? thisWeekEntries.reduce((sum, e) => sum + e.moodValue, 0) /
        thisWeekEntries.length
      : 0
  const lastWeekAvg =
    lastWeekEntries.length > 0
      ? lastWeekEntries.reduce((sum, e) => sum + e.moodValue, 0) /
        lastWeekEntries.length
      : 0

  const trend =
    thisWeekAvg > lastWeekAvg + 0.2
      ? "improving"
      : thisWeekAvg < lastWeekAvg - 0.2
      ? "declining"
      : "stable"

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Most Common Mood */}
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-3">
          <p className="text-xs text-slate-600 mb-1">{t("insights.mostCommonMood")}</p>
          <div className="text-2xl mb-1">{moodEmojis[parseInt(mostCommonMood)]}</div>
          <p className="text-xs text-slate-700">
            {moodLabels[parseInt(mostCommonMood)]}
          </p>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-3">
          <p className="text-xs text-slate-600 mb-1">{t("insights.trend")}</p>
          <div className="flex items-center gap-1 mb-1">
            {trend === "improving" && (
              <TrendingUp className="h-4 w-4 text-green-600" />
            )}
            {trend === "declining" && (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            {trend === "stable" && (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <p className="text-xs text-slate-700">
            {trend === "improving" && t("insights.improving")}
            {trend === "declining" && t("insights.declining")}
            {trend === "stable" && t("insights.stable")}
          </p>
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-3">
          <p className="text-xs text-slate-600 mb-1">{t("insights.lastWeekVsThisWeek")}</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg font-semibold text-slate-900">
              {lastWeekAvg > 0 ? lastWeekAvg.toFixed(1) : "-"}
            </span>
            <span className="text-xs text-slate-500">→</span>
            <span className="text-lg font-semibold text-teal-600">
              {thisWeekAvg > 0 ? thisWeekAvg.toFixed(1) : "-"}
            </span>
          </div>
          <p className="text-xs text-slate-500">Ø Stimmung</p>
        </CardContent>
      </Card>
    </div>
  )
}
