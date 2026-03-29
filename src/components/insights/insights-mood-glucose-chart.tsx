"use client"

import { useEffect, useState } from "react"
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { InsightsPeriodTabs } from "@/components/insights/insights-period-tabs"
import { useTranslation } from "@/hooks/useTranslation"
import type { DailyMoodGlucosePoint, InsightsTimeRangeKey } from "@/lib/insights-aggregate"

const GLUCOSE_STROKE = "#0d9488"
const GLUCOSE_FILL = "#14b8a6"
const MOOD_STROKE = "#7c3aed"
const MOOD_FILL = "#a78bfa"

interface InsightsMoodGlucoseChartProps {
  data: DailyMoodGlucosePoint[]
  timeRange: InsightsTimeRangeKey
  onTimeRangeChange: (v: InsightsTimeRangeKey) => void
}

export function InsightsMoodGlucoseChart({
  data,
  timeRange,
  onTimeRangeChange,
}: InsightsMoodGlucoseChartProps) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const chartRows = data.map((d) => ({
    label: d.label,
    avgGlucose: d.avgGlucose,
    mood: d.mood,
  }))

  const hasAnySignal = data.some((d) => d.avgGlucose != null || d.mood != null)

  useEffect(() => {
    let cancelled = false
    setSummaryLoading(true)
    setSummary(null)
    void (async () => {
      try {
        const res = await fetch("/api/insights/correlation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ timeRange }),
        })
        const json = (await res.json()) as { summary?: string }
        if (!cancelled && typeof json.summary === "string") {
          setSummary(json.summary)
        }
      } catch {
        if (!cancelled) setSummary(null)
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [timeRange])

  return (
    <Card className="rounded-xl border-teal-100 bg-white shadow-sm w-full">
      <CardContent className="p-5 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {t("insights.moodGlucoseTitle")}
            </h2>
            <p className="text-sm text-slate-600">{t("insights.moodGlucoseSubtitle")}</p>
          </div>
          <InsightsPeriodTabs
            value={timeRange}
            onValueChange={onTimeRangeChange}
            size="compact"
            className="shrink-0"
          />
        </div>

        {!hasAnySignal ? (
          <p className="text-sm text-slate-500 text-center py-10">{t("insights.chartNoData")}</p>
        ) : (
          <div className="w-full h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartRows} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534e" }} interval="preserveStartEnd" />
                <YAxis
                  yAxisId="left"
                  domain={[40, "auto"]}
                  tick={{ fontSize: 11, fill: "#0f766e" }}
                  label={{
                    value: t("insights.legendGlucose"),
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#0f766e", fontSize: 11 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#6d28d9" }}
                  label={{
                    value: t("insights.legendMood"),
                    angle: 90,
                    position: "insideRight",
                    style: { fill: "#6d28d9", fontSize: 11 },
                  }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                  formatter={(value, _name, item) => {
                    const key = (item as { dataKey?: string })?.dataKey
                    const num = typeof value === "number" ? value : undefined
                    if (key === "avgGlucose") {
                      return [num != null ? `${num} ${t("units.mgdl")}` : "—", t("insights.legendGlucose")]
                    }
                    if (key === "mood") {
                      return [num != null ? String(num) : "—", t("insights.legendMood")]
                    }
                    return [value, _name] as [string, string]
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgGlucose"
                  name={t("insights.legendGlucose")}
                  legendType="none"
                  fill={GLUCOSE_FILL}
                  fillOpacity={0.18}
                  stroke="none"
                  connectNulls
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgGlucose"
                  name={t("insights.legendGlucose")}
                  stroke={GLUCOSE_STROKE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: GLUCOSE_STROKE }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="mood"
                  name={t("insights.legendMood")}
                  legendType="none"
                  fill={MOOD_FILL}
                  fillOpacity={0.12}
                  stroke="none"
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mood"
                  name={t("insights.legendMood")}
                  stroke={MOOD_STROKE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: MOOD_STROKE }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasAnySignal ? (
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-700 mt-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-full bg-[#0d9488]" aria-hidden />
              {t("insights.legendGlucose")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded-full bg-[#7c3aed]" aria-hidden />
              {t("insights.legendMood")}
            </span>
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
          <p className="text-xs font-medium text-teal-900/80 mb-2">{t("insights.correlationTitle")}</p>
          {summaryLoading ? (
            <p className="text-sm text-slate-600">{t("insights.correlationLoading")}</p>
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed">{summary ?? t("insights.correlationFallback")}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-2">{t("insights.correlationDisclaimer")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
