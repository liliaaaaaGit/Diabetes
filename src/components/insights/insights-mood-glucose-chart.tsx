"use client"

import { useEffect, useState } from "react"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { formatGlucose, glucoseChartScale, mgDlToMmolL } from "@/lib/glucose-units"
import type { DailyMoodGlucosePoint, InsightsTimeRangeKey } from "@/lib/insights-aggregate"
import { InsightsChartFrame, InsightsChartScrollArea } from "@/components/insights/insights-chart-frame"

const GLUCOSE_STROKE = "#0d9488"
const MOOD_STROKE = "#7c3aed"

interface InsightsMoodGlucoseChartProps {
  data: DailyMoodGlucosePoint[]
  timeRange: InsightsTimeRangeKey
}

export function InsightsMoodGlucoseChart({ data, timeRange }: InsightsMoodGlucoseChartProps) {
  const { t } = useTranslation()
  const { displayUnit, unitSuffix, targetMinMgDl, targetMaxMgDl } = useUserPreferences()
  const chartScale = glucoseChartScale(displayUnit, targetMinMgDl, targetMaxMgDl)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const chartRows = data.map((d) => ({
    label: d.label,
    avgGlucose:
      d.avgGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(d.avgGlucose)
          : d.avgGlucose
        : null,
    avgGlucoseMgDl: d.avgGlucose,
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
  }, [timeRange, targetMinMgDl, targetMaxMgDl])

  return (
    <InsightsChartFrame
      title={t("insights.moodGlucoseTitle")}
      footer={
        <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3">
          <p className="text-xs font-medium text-teal-900/80 mb-2">{t("insights.correlationTitle")}</p>
          {summaryLoading ? (
            <p className="text-sm text-slate-600">{t("insights.correlationLoading")}</p>
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed">{summary ?? t("insights.correlationFallback")}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-2">{t("insights.correlationDisclaimer")}</p>
        </div>
      }
    >
      {!hasAnySignal ? (
        <p className="text-sm text-slate-500 text-center py-10">{t("insights.chartNoData")}</p>
      ) : (
        <>
          <InsightsChartScrollArea pointCount={chartRows.length} heightClass="h-[320px] md:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534e" }} interval="preserveStartEnd" />
                <YAxis
                  yAxisId="left"
                  domain={[chartScale.yMin, "auto"]}
                  tick={{ fontSize: 11, fill: "#0f766e" }}
                  width={36}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#6d28d9" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const seen = new Set<string>()
                    const rows = payload.filter((entry) => {
                      const key = String(entry.dataKey ?? "")
                      if (!key || seen.has(key)) return false
                      seen.add(key)
                      return true
                    })
                    return (
                      <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-sm">
                        <p className="font-medium text-slate-700 mb-1">{label}</p>
                        {rows.map((entry) => {
                          const key = String(entry.dataKey ?? "")
                          const num = typeof entry.value === "number" ? entry.value : undefined
                          if (key === "avgGlucose") {
                            const mg = (entry.payload as { avgGlucoseMgDl?: number | null })?.avgGlucoseMgDl
                            return (
                              <p key={key} className="text-slate-900 tabular-nums">
                                {t("insights.legendGlucose").replace(/\s*\(.*\)$/, "")}:{" "}
                                {mg != null ? `${formatGlucose(mg, displayUnit)} ${unitSuffix}` : "—"}
                              </p>
                            )
                          }
                          if (key === "mood") {
                            return (
                              <p key={key} className="text-slate-900 tabular-nums">
                                {t("insights.legendMood")}: {num != null ? String(num) : "—"}
                              </p>
                            )
                          }
                          return null
                        })}
                      </div>
                    )
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgGlucose"
                  stroke={GLUCOSE_STROKE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: GLUCOSE_STROKE }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mood"
                  stroke={MOOD_STROKE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: MOOD_STROKE }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </InsightsChartScrollArea>
          <div className="mt-3 flex flex-col items-stretch gap-2 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 shrink-0 rounded-full bg-[#0d9488]" aria-hidden />
              <span className="leading-relaxed">{t("insights.legendGlucoseWithUnit", { unit: unitSuffix })}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 shrink-0 rounded-full bg-[#7c3aed]" aria-hidden />
              <span className="leading-relaxed">{t("insights.legendMood")}</span>
            </span>
          </div>
        </>
      )}
    </InsightsChartFrame>
  )
}
