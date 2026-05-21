"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useTranslation } from "@/hooks/useTranslation"
import type { DailyMoodGlucosePoint } from "@/lib/insights-aggregate"
import { InsightsChartFrame, InsightsChartScrollArea } from "@/components/insights/insights-chart-frame"

const MOOD_STROKE = "#7c3aed"

interface InsightsMoodTrendChartProps {
  data: DailyMoodGlucosePoint[]
}

export function InsightsMoodTrendChart({ data }: InsightsMoodTrendChartProps) {
  const { t } = useTranslation()

  const chartRows = data.map((d) => ({
    label: d.label,
    mood: d.mood,
  }))

  const hasMood = data.some((d) => d.mood != null)

  return (
    <InsightsChartFrame title={t("insights.moodTrendTitle")}>
      {!hasMood ? (
        <p className="text-sm text-slate-500 text-center py-10">{t("empty.moodChartEmpty")}</p>
      ) : (
        <InsightsChartScrollArea pointCount={chartRows.length}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534e" }} interval="preserveStartEnd" />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: "#6d28d9" }}
                width={32}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                formatter={(value) => [
                  typeof value === "number" ? String(value) : "—",
                  t("insights.legendMood"),
                ]}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke={MOOD_STROKE}
                strokeWidth={2.5}
                dot={{ r: 3, fill: MOOD_STROKE }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </InsightsChartScrollArea>
      )}
      {hasMood ? (
        <p className="text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-8 shrink-0 rounded-full bg-[#7c3aed]" aria-hidden />
            {t("insights.legendMood")}
          </span>
        </p>
      ) : null}
    </InsightsChartFrame>
  )
}
