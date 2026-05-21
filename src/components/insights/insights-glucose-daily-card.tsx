"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { formatGlucose, mgDlToMmolL } from "@/lib/glucose-units"
import type { DailyMoodGlucosePoint } from "@/lib/insights-aggregate"

interface InsightsGlucoseDailyCardProps {
  chartPoints: DailyMoodGlucosePoint[]
  overallAvgGlucose: number | null
}

/** Daily glucose sparkline + period average (without insulin/carbs/entry stat cards). */
export function InsightsGlucoseDailyCard({
  chartPoints,
  overallAvgGlucose,
}: InsightsGlucoseDailyCardProps) {
  const { t } = useTranslation()
  const { displayUnit, unitSuffix } = useUserPreferences()

  const sparkData = chartPoints.map((p) => ({
    name: p.label,
    bg:
      p.avgGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(p.avgGlucose)
          : p.avgGlucose
        : null,
    bgMgDl: p.avgGlucose,
  }))

  return (
    <Card className="w-full rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
      <CardContent className="flex min-h-[120px] flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {t("insights.summaryDailyBg")}
        </p>
        <div className="h-[52px] w-full -mx-1">
          <ResponsiveContainer width="100%" height={52}>
            <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const mg = (payload[0]?.payload as { bgMgDl?: number | null } | undefined)?.bgMgDl
                  return (
                    <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm">
                      <p className="font-medium text-slate-700">{label}</p>
                      <p className="tabular-nums text-slate-900">
                        {mg != null ? `${formatGlucose(mg, displayUnit)} ${unitSuffix}` : "—"}
                      </p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="bg"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
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
