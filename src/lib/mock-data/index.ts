import { Entry, EntryType, DashboardStats, GlucoseEntry, GlucoseUnit } from "@/lib/types"
import { mockEntries } from "./entries"
import { mockConversations } from "./conversations"
import { mockInsights } from "./insights"

// Export all mock data
export { mockEntries, mockConversations, mockInsights }

// Helper function to get entries by date (YYYY-MM-DD format)
export function getEntriesByDate(date: string): Entry[] {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  return mockEntries.filter((entry) => {
    const entryDate = new Date(entry.timestamp)
    return entryDate >= targetDate && entryDate < nextDay
  })
}

// Helper function to get entries by type
export function getEntriesByType(type: EntryType): Entry[] {
  return mockEntries.filter((entry) => entry.type === type)
}

// Helper function to get recent entries
export function getRecentEntries(limit: number): Entry[] {
  return [...mockEntries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// Helper function to get today's entries
export function getTodayEntries(): Entry[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return mockEntries.filter((entry) => {
    const entryDate = new Date(entry.timestamp)
    return entryDate >= today && entryDate < tomorrow
  })
}

// Helper function to convert mg/dL to mmol/L
function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.0182) * 10) / 10
}

// Helper function to convert mmol/L to mg/dL
function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.0182)
}

// Calculate dashboard stats
export function getDashboardStats(unit: GlucoseUnit = "mg_dl"): DashboardStats {
  const glucoseEntries = getEntriesByType("glucose") as GlucoseEntry[]
  
  // Filter entries by unit or convert
  const relevantEntries = glucoseEntries
    .map((entry) => {
      if (entry.unit === unit) {
        return entry.value
      } else if (entry.unit === "mg_dl" && unit === "mmol_l") {
        return mgdlToMmol(entry.value)
      } else {
        return mmolToMgdl(entry.value)
      }
    })
    .filter((value) => !isNaN(value))

  // Calculate average glucose
  const avgGlucose =
    relevantEntries.length > 0
      ? Math.round(
          (relevantEntries.reduce((sum, val) => sum + val, 0) / relevantEntries.length) * 10
        ) / 10
      : 0

  // Get today's entries count
  const entriesToday = getTodayEntries().length

  // Calculate Time in Range (70-180 mg/dL or 3.9-10.0 mmol/L)
  const targetRange = unit === "mg_dl" ? { low: 70, high: 180 } : { low: 3.9, high: 10.0 }
  
  const inRangeCount = relevantEntries.filter(
    (value) => value >= targetRange.low && value <= targetRange.high
  ).length
  
  const timeInRange =
    relevantEntries.length > 0
      ? Math.round((inRangeCount / relevantEntries.length) * 100)
      : 0

  // Get last glucose entry
  const lastGlucoseEntry = glucoseEntries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  const lastGlucose = lastGlucoseEntry
    ? {
        value:
          lastGlucoseEntry.unit === unit
            ? lastGlucoseEntry.value
            : unit === "mmol_l"
            ? mgdlToMmol(lastGlucoseEntry.value)
            : mmolToMgdl(lastGlucoseEntry.value),
        timestamp: lastGlucoseEntry.timestamp,
        context: lastGlucoseEntry.context,
      }
    : undefined

  return {
    avgGlucose,
    unit,
    entriesToday,
    timeInRange,
    lastGlucose,
  }
}

// Helper function to get entries in a date range
export function getEntriesInRange(startDate: string, endDate: string): Entry[] {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return mockEntries.filter((entry) => {
    const entryDate = new Date(entry.timestamp)
    return entryDate >= start && entryDate <= end
  })
}

// Helper function to get entries for the last N days
export function getEntriesForLastDays(days: number): Entry[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  return mockEntries.filter((entry) => {
    const entryDate = new Date(entry.timestamp)
    return entryDate >= startDate && entryDate <= endDate
  })
}
