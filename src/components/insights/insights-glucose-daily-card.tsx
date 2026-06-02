"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { formatGlucose, mgDlToMmolL } from "@/lib/glucose-units"
import type { DailyGlucoseVariabilityPoint } from "@/lib/insights-aggregate"

interface InsightsGlucoseDailyCardProps {
  chartPoints: DailyGlucoseVariabilityPoint[]
  overallAvgGlucose: number | null
}

/** Daily glucose variability card (min/max band + daily average). */
export function InsightsGlucoseDailyCard({
  chartPoints,
  overallAvgGlucose,
}: InsightsGlucoseDailyCardProps) {
  const { t } = useTranslation()
  const { displayUnit, unitSuffix } = useUserPreferences()

  const sparkData = chartPoints.map((p) => ({
    name: p.label,
    min:
      p.minGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(p.minGlucose)
          : p.minGlucose
        : null,
    max:
      p.maxGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(p.maxGlucose)
          : p.maxGlucose
        : null,
    avg:
      p.avgGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(p.avgGlucose)
          : p.avgGlucose
        : null,
    minMgDl: p.minGlucose,
    maxMgDl: p.maxGlucose,
    avgMgDl: p.avgGlucose,
  }))

  return (
    <Card className="w-full rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
      <CardContent className="flex min-h-[120px] flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {t("insights.summaryDailyBg")}
        </p>
        <div className="h-[160px] w-full -mx-1">
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={sparkData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0]?.payload as
                    | { minMgDl?: number | null; maxMgDl?: number | null; avgMgDl?: number | null }
                    | undefined
                  return (
                    <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm">
                      <p className="font-medium text-slate-700">{label}</p>
                      <p className="tabular-nums text-slate-900">
                        Min: {point?.minMgDl != null ? `${formatGlucose(point.minMgDl, displayUnit)} ${unitSuffix}` : "—"}
                      </p>
                      <p className="tabular-nums text-slate-900">
                        Ø: {point?.avgMgDl != null ? `${formatGlucose(point.avgMgDl, displayUnit)} ${unitSuffix}` : "—"}
                      </p>
                      <p className="tabular-nums text-slate-900">
                        Max: {point?.maxMgDl != null ? `${formatGlucose(point.maxMgDl, displayUnit)} ${unitSuffix}` : "—"}
                      </p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="max"
                stroke="transparent"
                fill="#99f6e4"
                fillOpacity={0.35}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="min"
                stroke="transparent"
                fill="#ffffff"
                fillOpacity={1}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {overallAvgGlucose != null ? (
          <p className="text-sm tabular-nums text-slate-700">
            <span className="font-semibold text-teal-800">
              {formatGlucose(overallAvgGlucose, displayUnit)}
            </span>{" "}
            <span className="text-slate-500">{unitSuffix}</span>{" "}
            <span className="text-slate-500">({t("insights.periodAvgShort")})</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500">{t("insights.noGlucoseInPeriod")}</p>
        )}
      </CardContent>
    </Card>
  )
}
