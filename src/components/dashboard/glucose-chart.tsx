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
  const dateLocale = locale === "en" ? enUS : de
  const timeFmt = timeLabelFormat(timeRange)

  const now = new Date()
  const cutoffDate = cutoffForRange(timeRange, now)

  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = parseISO(entry.timestamp)
      return entryDate >= cutoffDate
    })
    .map((entry) => ({
      ...entry,
      timestamp: entry.timestamp,
      value: entry.unit === "mg_dl" ? entry.value : entry.value * 18.0182,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = filteredEntries.map((entry) => ({
    timestamp: entry.timestamp,
    value: Math.round(entry.value),
    context: entry.context,
    time: format(parseISO(entry.timestamp), timeFmt, { locale: dateLocale }),
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: (typeof chartData)[0] }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const entry = filteredEntries.find((e) => e.timestamp === data.timestamp)
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-semibold text-slate-900">{data.value} mg/dL</p>
          <p className="text-xs text-slate-600">
            {format(
              parseISO(data.timestamp),
              timeRange === "24h" ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy",
              { locale: dateLocale }
            )}
          </p>
          {entry && (
            <p className="text-xs text-slate-500 mt-1">
              {entry.context === "fasting" && t("dashboard.fasting")}
              {entry.context === "pre_meal" && t("dashboard.beforeMeal")}
              {entry.context === "post_meal" && t("dashboard.afterMeal")}
              {entry.context === "bedtime" && t("dashboard.bedtime")}
              {entry.context === "other" && t("dashboard.other")}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const tabTriggerClass =
    "text-[11px] px-2 py-1.5 sm:text-xs sm:px-2.5 whitespace-nowrap data-[state=active]:bg-teal-500 data-[state=active]:text-white"

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
            <TabsList className="h-auto min-h-8 w-full flex flex-wrap justify-start gap-0.5 p-1 sm:justify-end sm:max-w-[340px]">
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
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis
                dataKey="time"
                stroke="#78716C"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#78716C"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[60, 200]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceArea y1={70} y2={180} fill="#14B8A6" fillOpacity={0.14} stroke="none" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0D9488"
                strokeWidth={2}
                dot={{ fill: "#14B8A6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
