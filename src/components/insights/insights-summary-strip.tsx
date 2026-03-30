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
    <div className="w-full space-y-3 overflow-hidden">
      <Card className="rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
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

      <div className="grid grid-cols-3 gap-2 overflow-hidden">
        <Card className="min-w-0 rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
          <CardContent className="p-3 flex flex-col justify-center min-h-[110px]">
            <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide break-words">{t("insights.stripInsulin")}</p>
            <p className="text-lg sm:text-2xl font-bold text-teal-800 tabular-nums mt-1 break-words">
              {sumInsulin % 1 === 0 ? sumInsulin : sumInsulin.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{t("units.units")}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
          <CardContent className="p-3 flex flex-col justify-center min-h-[110px]">
            <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide break-words">{t("insights.stripCarbs")}</p>
            <p className="text-lg sm:text-2xl font-bold text-teal-800 tabular-nums mt-1 break-words">{sumCarbs}g</p>
            <p className="text-xs text-slate-500 mt-0.5">{t("dashboard.carbs")}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-xl border-teal-100 bg-teal-50/40 shadow-sm">
          <CardContent className="p-3 flex flex-col justify-center min-h-[110px]">
            <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide break-words">{t("insights.stripEntries")}</p>
            <p className="text-lg sm:text-2xl font-bold text-teal-800 tabular-nums mt-1 break-words">{entryCount}</p>
            <p className="text-xs text-slate-500 mt-0.5 break-words">{t("insights.entryCountHint")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
