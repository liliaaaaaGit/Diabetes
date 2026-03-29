"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

export interface BuddyMoodRadarDatum {
  subject: string
  value: number
}

export function BuddyMoodRadar({ data }: { data: BuddyMoodRadarDatum[] }) {
  return (
    <div className="h-[300px] w-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
          />
          <Radar
            name="mood"
            dataKey="value"
            stroke="#d97706"
            fill="#fbbf24"
            fillOpacity={0.5}
            strokeWidth={2}
            dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
