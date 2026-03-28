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
import { format, subHours, subDays, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"

interface GlucoseChartProps {
  entries: GlucoseEntry[]
  timeRange?: "24h" | "7d"
}

export function GlucoseChart({ entries, timeRange: initialTimeRange = "24h" }: GlucoseChartProps) {
  const [timeRange, setTimeRange] = useState<"24h" | "7d">(initialTimeRange)
  const { t } = useTranslation()

  // Filter entries based on time range
  const now = new Date()
  const cutoffDate =
    timeRange === "24h" ? subHours(now, 24) : subDays(now, 7)

  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = parseISO(entry.timestamp)
      return entryDate >= cutoffDate
    })
    .map((entry) => ({
      ...entry,
      timestamp: entry.timestamp,
      value: entry.unit === "mg_dl" ? entry.value : entry.value * 18.0182, // Convert to mg/dL for display
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Format data for chart
  const chartData = filteredEntries.map((entry) => ({
    timestamp: entry.timestamp,
    value: Math.round(entry.value),
    context: entry.context,
    time: format(parseISO(entry.timestamp), timeRange === "24h" ? "HH:mm" : "dd.MM", { locale: de }),
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const entry = filteredEntries.find((e) => e.timestamp === data.timestamp)
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-semibold text-slate-900">{data.value} mg/dL</p>
          <p className="text-xs text-slate-600">{data.time}</p>
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

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {t("dashboard.glucoseTrend")}
          </CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "24h" | "7d")}>
            <TabsList className="h-8">
              <TabsTrigger value="24h" className="text-xs px-3">
                {t("dashboard.hours24")}
              </TabsTrigger>
              <TabsTrigger value="7d" className="text-xs px-3">
                {t("dashboard.days7")}
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
              {/* Teal gradient fill under the curve */}
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[60, 200]}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Target range as a soft band */}
            <ReferenceArea
              y1={70}
              y2={180}
              fill="#22D3EE"
              fillOpacity={0.14}
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#06B6D4"
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
