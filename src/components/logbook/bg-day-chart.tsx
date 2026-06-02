"use client"

import { useMemo } from "react"
import type { GlucoseEntry } from "@/lib/types"
import {
  BgCurveChart,
  bgDotConfig,
  buildBgCurveData,
} from "@/components/charts/bg-curve-chart"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseEntryToMgDl } from "@/lib/glucose-units"
import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns"

interface BgDayChartProps {
  /** The day to display (only the date part is used). */
  date: Date
  /** All glucose readings for that day (CGM + manual). */
  entries: GlucoseEntry[]
}

/**
 * Inline blood-glucose curve for a single day, shown on the Tagebuch's
 * "Blutzucker" tab instead of listing every reading as its own card. Reuses the
 * shared {@link BgCurveChart} so it matches the Dashboard chart exactly, and
 * adds a compact summary line (average / min / max / number of readings).
 */
export function BgDayChart({ date, entries }: BgDayChartProps) {
  const { t } = useTranslation()
  const { displayUnit, formatGlucoseWithUnit: fmt } = useUserPreferences()

  // Day window. For "today", the chart ends at "now" (never in the future).
  const dayStartMs = startOfDay(date).getTime()
  const now = new Date()
  const domainEndMs = isSameDay(date, now)
    ? now.getTime()
    : Math.min(endOfDay(date).getTime(), now.getTime())
  const xDomain: [number, number] = [dayStartMs, Math.max(dayStartMs, domainEndMs)]
  // Major ticks every 6 hours; include only ticks inside the visible domain.
  const xTicks = [0, 6, 12, 18, 24]
    .map((h) => dayStartMs + h * 60 * 60 * 1000)
    .filter((ts) => ts >= xDomain[0] && ts <= xDomain[1])

  const visibleEntries = useMemo(() => {
    const start = xDomain[0]
    const end = xDomain[1]
    return entries.filter((entry) => {
      const ts = parseISO(entry.timestamp).getTime()
      return Number.isFinite(ts) && ts >= start && ts <= end
    })
  }, [entries, xDomain])

  const data = useMemo(
    () => buildBgCurveData(visibleEntries, displayUnit),
    [visibleEntries, displayUnit]
  )

  const stats = useMemo(() => {
    if (visibleEntries.length === 0) return null
    const valuesMgDl = visibleEntries.map((e) => glucoseEntryToMgDl(e))
    const sum = valuesMgDl.reduce((s, v) => s + v, 0)
    return {
      avg: Math.round(sum / valuesMgDl.length),
      min: Math.min(...valuesMgDl),
      max: Math.max(...valuesMgDl),
      count: visibleEntries.length,
    }
  }, [visibleEntries])

  if (data.length === 0 || stats === null) {
    return (
      <p className="text-sm text-slate-500 text-center py-10 px-2">
        {t("logbook.bgDayEmpty")}
      </p>
    )
  }

  return (
    <div className="space-y-2 w-full">
      <BgCurveChart
        data={data}
        xDomain={xDomain}
        xTicks={xTicks}
        xTickFormat="HH:mm"
        tooltipDateFormat="dd.MM.yyyy HH:mm"
        dotConfig={bgDotConfig(data.length)}
        height={220}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-slate-500">
        <span>
          {t("logbook.bgDayAvg")} {fmt(stats.avg).value} {fmt(stats.avg).suffix}
        </span>
        <span>
          {t("logbook.bgDayMin")} {fmt(stats.min).value}
        </span>
        <span>
          {t("logbook.bgDayMax")} {fmt(stats.max).value}
        </span>
        <span>{t("logbook.bgDayReadings", { count: stats.count })}</span>
      </div>
    </div>
  )
}
