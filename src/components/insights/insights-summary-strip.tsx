"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useTranslation } from "@/hooks/useTranslation"
import type { DailyMoodGlucosePoint } from "@/lib/insights-aggregate"

interface InsightsSummaryStripProps {
  chartPoints: DailyMoodGlucosePoint[]
  overallAvgGlucose: number | null
  sumInsulin: number
  sumCarbs: number
  entryCount: number
}

export function InsightsSummaryStrip({
  chartPoints,
  overallAvgGlucose,
  sumInsulin,
  sumCarbs,
  entryCount,
}: InsightsSummaryStripProps) {
  const { t } = useTranslation()
  const sparkData = chartPoints.map((p) => ({ name: p.label, bg: p.avgGlucose }))

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full">
      <Card className="rounded-xl border-teal-100 bg-teal-50/40 shadow-sm col-span-2 xl:col-span-1">
        <CardContent className="p-4 flex flex-col gap-2 min-h-[120px]">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            {t("insights.summaryDailyBg")}
          </p>
          <div className="h-[52px] w-full -mx-1">
            <ResponsiveContainer width="100%" height={52}>
              <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <Tooltip
                  formatter={(v) => {
                    const num = typeof v === "number" ? v : undefined
                    return num != null
                      ? [`${num} ${t("units.mgdl")}`, t("insights.avgGlucose")]
                      : ["—", ""]
                  }}
                  labelFormatter={(l) => l}
                  contentStyle={{ fontSize: 12 }}
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
            <p className="text-sm text-slate-700 tabular-nums">
              <span className="font-semibold text-teal-800">{overallAvgGlucose}</span>{" "}
              <span className="text-slate-500">{t("units.mgdl")}</span>{" "}
              <span className="text-slate-500">({t("insights.periodAvgShort")})</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">{t("insights.noGlucoseInPeriod")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-center min-h-[120px]">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t("insights.stripInsulin")}</p>
          <p className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
            {sumInsulin % 1 === 0 ? sumInsulin : sumInsulin.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{t("units.units")}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-center min-h-[120px]">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t("insights.stripCarbs")}</p>
          <p className="text-2xl font-bold text-teal-800 tabular-nums mt-1">{sumCarbs}g</p>
          <p className="text-xs text-slate-500 mt-0.5">{t("dashboard.carbs")}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-center min-h-[120px]">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t("insights.stripEntries")}</p>
          <p className="text-2xl font-bold text-teal-800 tabular-nums mt-1">{entryCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t("insights.entryCountHint")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
