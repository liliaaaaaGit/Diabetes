"use client"

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
import type { GlucoseEntry } from "@/lib/types"
import { useTranslation } from "@/hooks/useTranslation"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import {
  glucoseChartScale,
  glucoseEntryToMgDl,
  mgDlToMmolL,
} from "@/lib/glucose-units"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale/de"
import { enUS } from "date-fns/locale/en-US"

/**
 * A single point on the glucose curve. `ts` is the epoch time in milliseconds
 * so the X-axis can place points by their *actual* clock time (time-proportional),
 * while `value` is already converted to the user's display unit.
 */
export interface BgCurvePoint {
  timestamp: string
  ts: number
  value: number
  valueMgDl: number
}

/** Dot config type used by recharts (an object of style props, or `false` to hide dots). */
export type BgDotConfig =
  | false
  | { fill: string; r: number; stroke?: string; strokeWidth: number }

/**
 * Scale the dot size to how many points are on screen. A handful of manual
 * readings look best as clear dots; a dense CGM trace (96/day) would just turn
 * into overlapping blobs, so we shrink (or drop) the dots there. Shared by the
 * Dashboard chart and the Tagebuch day chart so both look identical.
 */
export function bgDotConfig(pointCount: number): BgDotConfig {
  if (pointCount > 300) return false
  if (pointCount > 60) return { fill: "#14B8A6", r: 1.6, strokeWidth: 0 }
  if (pointCount > 24)
    return { fill: "#14B8A6", r: 2.5, stroke: "#ffffff", strokeWidth: 1 }
  return { fill: "#14B8A6", r: 4, stroke: "#ffffff", strokeWidth: 1.5 }
}

/**
 * Turn raw glucose entries into chart points in the user's display unit,
 * sorted by time. Shared so the Dashboard and the diary build their data
 * the exact same way.
 */
export function buildBgCurveData(
  entries: GlucoseEntry[],
  displayUnit: "mg/dL" | "mmol/L"
): BgCurvePoint[] {
  return entries
    .map((entry) => {
      const valueMgDl = glucoseEntryToMgDl(entry)
      const displayVal =
        displayUnit === "mmol/L" ? mgDlToMmolL(valueMgDl) : Math.round(valueMgDl)
      return {
        timestamp: entry.timestamp,
        ts: parseISO(entry.timestamp).getTime(),
        value: displayVal,
        valueMgDl,
      }
    })
    .sort((a, b) => a.ts - b.ts)
}

interface BgCurveChartProps {
  /** Chart points, already in display units (use `buildBgCurveData`). */
  data: BgCurvePoint[]
  /** [start, end] of the X-axis in epoch milliseconds. */
  xDomain: [number, number]
  /** date-fns format string for the X-axis tick labels (e.g. "HH:mm"). */
  xTickFormat: string
  /** Optional explicit X-axis tick positions (epoch ms). */
  xTicks?: number[]
  /** date-fns format string for the date line inside the tooltip. */
  tooltipDateFormat: string
  /** Chart height in pixels. */
  height?: number
  /** Dot styling (defaults to `bgDotConfig(data.length)`). */
  dotConfig?: BgDotConfig
  /** Toggle Y-axis rendering (useful when an external sticky axis is shown). */
  showYAxis?: boolean
  /** Optional fixed Y-axis ticks. */
  yTicks?: number[]
}

/**
 * Shared blood-glucose line chart. Renders the green target zone, red hypo zone
 * and yellow high zone as reference bands, a linear (not splined) line and a
 * touch-friendly tooltip. Both the Dashboard and the Tagebuch use this so the
 * curve looks identical in every context.
 */
export function BgCurveChart({
  data,
  xDomain,
  xTickFormat,
  xTicks,
  tooltipDateFormat,
  height = 250,
  dotConfig,
  showYAxis = true,
  yTicks,
}: BgCurveChartProps) {
  const { locale } = useTranslation()
  const { displayUnit, formatGlucoseWithUnit, targetMinMgDl, targetMaxMgDl } =
    useUserPreferences()
  const chartScale = glucoseChartScale(displayUnit, targetMinMgDl, targetMaxMgDl)
  const dateLocale = locale === "en" ? enUS : de
  const dots = dotConfig ?? bgDotConfig(data.length)

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: { payload: BgCurvePoint }[]
  }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      const formatted = formatGlucoseWithUnit(point.valueMgDl)
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-semibold text-slate-900">
            {formatted.value} {formatted.suffix}
          </p>
          <p className="text-xs text-slate-600">
            {format(parseISO(point.timestamp), tooltipDateFormat, {
              locale: dateLocale,
            })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 4, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={xDomain}
          ticks={xTicks}
          stroke="#78716C"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(ts: number) =>
            format(new Date(ts), xTickFormat, { locale: dateLocale })
          }
        />
        <YAxis
          hide={!showYAxis}
          stroke="#78716C"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[chartScale.yMin, chartScale.yMaxCap]}
          ticks={yTicks}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Hypo zone (below the target range) – a low value is a medical
            emergency, so we highlight it in red. */}
        <ReferenceArea
          y1={chartScale.yMin}
          y2={chartScale.targetLow}
          fill="#FEE2E2"
          fillOpacity={0.6}
          stroke="none"
        />
        {/* In-range (target) zone – green. */}
        <ReferenceArea
          y1={chartScale.targetLow}
          y2={chartScale.targetHigh}
          fill="#D1FAE5"
          fillOpacity={0.5}
          stroke="none"
        />
        {/* High zone (above the target range) – yellow. */}
        <ReferenceArea
          y1={chartScale.targetHigh}
          y2={chartScale.yMaxCap}
          fill="#FEF3C7"
          fillOpacity={0.45}
          stroke="none"
        />
        <Line
          type="linear"
          dataKey="value"
          stroke="#0D9488"
          strokeWidth={2}
          dot={dots}
          activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
