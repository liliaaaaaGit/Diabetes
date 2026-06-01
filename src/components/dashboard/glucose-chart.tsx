"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import { GlucoseEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { glucoseChartScale, mgDlToMmolL } from "@/lib/glucose-units"
import { format, subHours, subDays, subMonths, subYears, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"

export type GlucoseChartTimeRange = "24h" | "7d" | "30d" | "3m" | "1y"

interface GlucoseChartProps {
  entries: GlucoseEntry[]
  timeRange?: GlucoseChartTimeRange
}

function cutoffForRange(range: GlucoseChartTimeRange, now: Date): Date {
  switch (range) {
    case "24h":
      return subHours(now, 24)
    case "7d":
      return subDays(now, 7)
    case "30d":
      return subDays(now, 30)
    case "3m":
      return subMonths(now, 3)
    case "1y":
      return subYears(now, 1)
    default:
      return subHours(now, 24)
  }
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
  const { t, locale } = useTranslation()
  const { displayUnit, formatGlucoseWithUnit, targetMinMgDl, targetMaxMgDl } = useUserPreferences()
  const chartScale = glucoseChartScale(displayUnit, targetMinMgDl, targetMaxMgDl)
  const dateLocale = locale === "en" ? enUS : de
  const timeFmt = timeLabelFormat(timeRange)

  const now = new Date()
  const cutoffDate = cutoffForRange(timeRange, now)

  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = parseISO(entry.timestamp)
      return entryDate >= cutoffDate && entryDate <= now
    })
    .map((entry) => ({
      ...entry,
      timestamp: entry.timestamp,
      valueMgDl: entry.value,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = filteredEntries.map((entry) => {
    const displayVal =
      displayUnit === "mmol/L"
        ? mgDlToMmolL(entry.valueMgDl)
        : Math.round(entry.valueMgDl)
    return {
      timestamp: entry.timestamp,
      // Numeric epoch time (ms) so the X-axis can position points by *actual*
      // clock time rather than by their index in the list.
      ts: parseISO(entry.timestamp).getTime(),
      value: displayVal,
      valueMgDl: entry.valueMgDl,
    }
  })

  // X-axis domain = the full time window for the selected range (e.g. the last
  // 24 hours, last 7 days, ...). This guarantees the horizontal distance
  // between two points is proportional to the real time elapsed between them.
  const xDomain: [number, number] = [cutoffDate.getTime(), now.getTime()]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: (typeof chartData)[0] }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const formatted = formatGlucoseWithUnit(data.valueMgDl)
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-semibold text-slate-900">
            {formatted.value} {formatted.suffix}
          </p>
          <p className="text-xs text-slate-600">
            {format(
              parseISO(data.timestamp),
              timeRange === "24h" ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy",
              { locale: dateLocale }
            )}
          </p>
        </div>
      )
    }
    return null
  }

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
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 4, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={xDomain}
                stroke="#78716C"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(ts: number) =>
                  format(new Date(ts), timeFmt, { locale: dateLocale })
                }
              />
              <YAxis
                stroke="#78716C"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[chartScale.yMin, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Hypo zone (below the target range) – a low value is a medical
                  emergency, so we highlight it in red. */}
              <ReferenceArea
                y1={chartScale.yMin}
                y2={chartScale.targetLow}
                fill="#FEE2E2"
                fillOpacity={0.6}
                stroke="none"
              />
              {/* In-range (target) zone – green. */}
              <ReferenceArea
                y1={chartScale.targetLow}
                y2={chartScale.targetHigh}
                fill="#D1FAE5"
                fillOpacity={0.5}
                stroke="none"
              />
              {/* High zone (above the target range) – yellow. */}
              <ReferenceArea
                y1={chartScale.targetHigh}
                y2={chartScale.yMaxCap}
                fill="#FEF3C7"
                fillOpacity={0.45}
                stroke="none"
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="#0D9488"
                strokeWidth={2}
                dot={{ fill: "#14B8A6", r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
