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
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { formatGlucose, glucoseChartScale, mgDlToMmolL } from "@/lib/glucose-units"
import type { DailyMoodGlucosePoint } from "@/lib/insights-aggregate"
import { InsightsChartFrame, InsightsChartScrollArea } from "@/components/insights/insights-chart-frame"

const GLUCOSE_STROKE = "#0d9488"

interface InsightsGlucoseTrendChartProps {
  data: DailyMoodGlucosePoint[]
}

export function InsightsGlucoseTrendChart({ data }: InsightsGlucoseTrendChartProps) {
  const { t } = useTranslation()
  const { displayUnit, unitSuffix, targetMinMgDl, targetMaxMgDl } = useUserPreferences()
  const chartScale = glucoseChartScale(displayUnit, targetMinMgDl, targetMaxMgDl)

  const chartRows = data.map((d) => ({
    label: d.label,
    avgGlucose:
      d.avgGlucose != null
        ? displayUnit === "mmol/L"
          ? mgDlToMmolL(d.avgGlucose)
          : d.avgGlucose
        : null,
    avgGlucoseMgDl: d.avgGlucose,
  }))

  const hasGlucose = data.some((d) => d.avgGlucose != null)

  return (
    <InsightsChartFrame title={t("insights.glucoseTrendTitle")}>
      {!hasGlucose ? (
        <p className="text-sm text-slate-500 text-center py-10">{t("empty.glucoseChartEmpty")}</p>
      ) : (
        <InsightsChartScrollArea pointCount={chartRows.length}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#57534e" }} interval="preserveStartEnd" />
              <YAxis
                domain={[chartScale.yMin, "auto"]}
                tick={{ fontSize: 11, fill: "#0f766e" }}
                width={40}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
                formatter={(_value, _name, item) => {
                  const mg = (item as { payload?: { avgGlucoseMgDl?: number | null } })?.payload
                    ?.avgGlucoseMgDl
                  return [
                    mg != null ? `${formatGlucose(mg, displayUnit)} ${unitSuffix}` : "—",
                    t("insights.legendGlucose").replace(/\s*\(.*\)$/, ""),
                  ]
                }}
              />
              <Line
                type="monotone"
                dataKey="avgGlucose"
                stroke={GLUCOSE_STROKE}
                strokeWidth={2.5}
                dot={{ r: 3, fill: GLUCOSE_STROKE }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </InsightsChartScrollArea>
      )}
      {hasGlucose ? (
        <p className="text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-8 shrink-0 rounded-full bg-[#0d9488]" aria-hidden />
            {t("insights.legendGlucoseWithUnit", { unit: unitSuffix })}
          </span>
        </p>
      ) : null}
    </InsightsChartFrame>
  )
}
