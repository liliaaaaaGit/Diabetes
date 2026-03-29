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
          <PolarGrid stroke="#99f6e4" strokeOpacity={0.65} />
          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
          />
          <Radar
            name="mood"
            dataKey="value"
            stroke="#14b8a6"
            fill="rgb(20, 184, 166)"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ r: 3, fill: "#14b8a6", strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
