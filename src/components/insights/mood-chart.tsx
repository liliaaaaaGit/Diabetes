"use client"

import { MoodEntry } from "@/lib/types"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { format, parseISO, subDays } from "date-fns"
import { de } from "date-fns/locale/de"
import { useTranslation } from "@/hooks/useTranslation"

interface MoodChartProps {
  entries: MoodEntry[]
  days: number
}

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
}

export function MoodChart({ entries, days }: MoodChartProps) {
  const { t } = useTranslation()
  const cutoffDate = subDays(new Date(), days)

  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = parseISO(entry.timestamp)
      return entryDate >= cutoffDate
    })
    .map((entry) => ({
      ...entry,
      timestamp: entry.timestamp,
      moodValue: entry.moodValue,
      date: format(parseISO(entry.timestamp), "dd.MM", { locale: de }),
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = filteredEntries.map((entry) => ({
    date: entry.date,
    mood: entry.moodValue,
    timestamp: entry.timestamp,
    note: entry.note,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const entry = filteredEntries.find((e) => e.timestamp === data.timestamp)
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="font-semibold text-slate-900 text-lg">
            {moodEmojis[data.mood]} {data.mood}/5
          </p>
          <p className="text-xs text-slate-600">{data.date}</p>
          {entry?.note && (
            <p className="text-xs text-slate-500 mt-1">{entry.note}</p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#78716C" fontSize={12}>
          {moodEmojis[payload.value]}
        </text>
      </g>
    )
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardContent className="p-6">
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">{t("empty.moodChartEmpty")}</p>
        ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
            <XAxis
              dataKey="date"
              stroke="#78716C"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#78716C"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[1, 5]}
              tick={<CustomYAxisTick />}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#EC4899"
              strokeWidth={2}
              fill="url(#colorMood)"
              dot={{ fill: "#EC4899", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
