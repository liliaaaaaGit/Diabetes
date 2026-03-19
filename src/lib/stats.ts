import type { Entry, GlucoseEntry, MoodEntry, ActivityEntry } from "./types"
import { DEFAULT_USER_ID } from "./constants"

/**
 * Calculate percentage of glucose values within target range (70-180 mg/dL)
 */
export function getTimeInRange(glucoseEntries: GlucoseEntry[]): number {
  if (glucoseEntries.length === 0) return 0
  const inRange = glucoseEntries.filter((e) => e.value >= 70 && e.value <= 180).length
  return Math.round((inRange / glucoseEntries.length) * 100)
}

/**
 * Get mood trend: comparing last 7 days vs previous 7 days
 */
export function getMoodTrend(moodEntries: MoodEntry[]): "improving" | "stable" | "declining" {
  if (moodEntries.length < 7) return "stable"

  const now = new Date()
  const last7Days = moodEntries.filter((e) => {
    const d = new Date(e.timestamp)
    return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  })
  const previous7Days = moodEntries.filter((e) => {
    const d = new Date(e.timestamp)
    return d >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) && d < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  })

  if (last7Days.length === 0 || previous7Days.length === 0) return "stable"

  const lastAvg = last7Days.reduce((sum, e) => sum + e.moodValue, 0) / last7Days.length
  const prevAvg = previous7Days.reduce((sum, e) => sum + e.moodValue, 0) / previous7Days.length

  const diff = lastAvg - prevAvg
  if (diff > 0.2) return "improving"
  if (diff < -0.2) return "declining"
  return "stable"
}

/**
 * Count entries by type
 */
export function getEntryCountsByType(entries: Entry[]): Record<string, number> {
  const counts: Record<string, number> = {
    glucose: 0,
    insulin: 0,
    meal: 0,
    activity: 0,
    mood: 0,
  }
  entries.forEach((e) => {
    counts[e.type] = (counts[e.type] || 0) + 1
  })
  return counts
}

/**
 * Calculate weekly statistics from entries
 */
export function getWeeklyStats(entries: Entry[]): {
  avgGlucose: number
  glucoseCount: number
  timeInRange: number
  totalEntries: number
  avgMood: number
  moodCount: number
  activityMinutes: number
} {
  const glucoseEntries = entries.filter((e) => e.type === "glucose") as GlucoseEntry[]
  const moodEntries = entries.filter((e) => e.type === "mood") as MoodEntry[]
  const activityEntries = entries.filter((e) => e.type === "activity") as ActivityEntry[]

  const avgGlucose =
    glucoseEntries.length > 0
      ? Math.round((glucoseEntries.reduce((sum, e) => sum + e.value, 0) / glucoseEntries.length) * 10) / 10
      : 0

  const timeInRange = getTimeInRange(glucoseEntries)

  const avgMood = moodEntries.length > 0 ? moodEntries.reduce((sum, e) => sum + e.moodValue, 0) / moodEntries.length : 0

  const activityMinutes = activityEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0)

  return {
    avgGlucose,
    glucoseCount: glucoseEntries.length,
    timeInRange,
    totalEntries: entries.length,
    avgMood: Math.round(avgMood * 10) / 10,
    moodCount: moodEntries.length,
    activityMinutes: Math.round(activityMinutes),
  }
}
