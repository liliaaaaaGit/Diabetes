"use client"

import { useState } from "react"
import { GlucoseEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import {
  BgCurveChart,
  bgDotConfig,
  buildBgCurveData,
} from "@/components/charts/bg-curve-chart"
import { parseISO } from "date-fns"

export type GlucoseChartTimeRange = "24h" | "7d" | "30d" | "3m" | "1y"

interface GlucoseChartProps {
  entries: GlucoseEntry[]
  timeRange?: GlucoseChartTimeRange
}

function cutoffForRange(range: GlucoseChartTimeRange, now: Date): Date {
  const rangeMs: Record<GlucoseChartTimeRange, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
  }
  return new Date(now.getTime() - rangeMs[range])
}

function timeLabelFormat(range: GlucoseChartTimeRange): string {
  switch (range) {
    case "24h":
      return "HH:mm"
    case "7d":
    case "30d":
    case "3m":
      return "dd.MM"
    case "1y":
      return "dd.MM.yy"
    default:
      return "HH:mm"
  }
}

export function GlucoseChart({
  entries,
  timeRange: initialTimeRange = "24h",
}: GlucoseChartProps) {
  const [timeRange, setTimeRange] = useState<GlucoseChartTimeRange>(initialTimeRange)
  const { t } = useTranslation()
  const { displayUnit } = useUserPreferences()

  const now = new Date()
  const cutoffDate = cutoffForRange(timeRange, now)

  const filteredEntries = entries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp)
    if (Number.isNaN(entryDate.getTime())) return false
    return entryDate >= cutoffDate && entryDate <= now
  })

  const chartData = buildBgCurveData(filteredEntries, displayUnit)

  // X-axis domain = the full time window for the selected range (e.g. the last
  // 24 hours, last 7 days, ...). This guarantees the horizontal distance
  // between two points is proportional to the real time elapsed between them.
  const xDomain: [number, number] = [cutoffDate.getTime(), now.getTime()]
  const dots = bgDotConfig(chartData.length)
  const tooltipDateFormat = timeRange === "24h" ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy"

  const tabTriggerClass =
    "min-h-[44px] shrink-0 px-3 text-xs sm:px-2.5 data-[state=active]:bg-teal-500 data-[state=active]:text-white"

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">{t("dashboard.glucoseTrend")}</CardTitle>
          <Tabs
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as GlucoseChartTimeRange)}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-auto w-full max-w-full justify-start gap-1 overflow-x-auto p-1 [-webkit-overflow-scrolling:touch] sm:justify-end sm:max-w-[340px]">
              <TabsTrigger value="24h" className={tabTriggerClass}>
                {t("dashboard.hours24")}
              </TabsTrigger>
              <TabsTrigger value="7d" className={tabTriggerClass}>
                {t("dashboard.days7")}
              </TabsTrigger>
              <TabsTrigger value="30d" className={tabTriggerClass}>
                {t("dashboard.days30")}
              </TabsTrigger>
              <TabsTrigger value="3m" className={tabTriggerClass}>
                {t("dashboard.months3")}
              </TabsTrigger>
              <TabsTrigger value="1y" className={tabTriggerClass}>
                {t("dashboard.year1")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12 px-2">{t("empty.glucoseChartEmpty")}</p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
            <div
              className="min-w-full"
              style={{ minWidth: Math.max(280, chartData.length * (timeRange === "24h" ? 12 : 28)) }}
            >
              <BgCurveChart
                data={chartData}
                xDomain={xDomain}
                xTickFormat={timeLabelFormat(timeRange)}
                tooltipDateFormat={tooltipDateFormat}
                dotConfig={dots}
                height={250}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
