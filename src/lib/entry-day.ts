import { addDays, format, parseISO, startOfDay } from "date-fns"

/** Local calendar day (YYYY-MM-DD) for an entry timestamp — avoids timezone off-by-one. */
export function entryLocalYmd(timestamp: string): string {
  return format(parseISO(timestamp), "yyyy-MM-dd")
}

export function isEntryOnLocalDay(timestamp: string, day: Date): boolean {
  return entryLocalYmd(timestamp) === format(startOfDay(day), "yyyy-MM-dd")
}

/** API range for one local calendar day (half-open interval). */
export function dayFiltersForDate(day: Date): { from: string; to: string } {
  const start = startOfDay(day)
  return {
    from: start.toISOString(),
    to: addDays(start, 1).toISOString(),
  }
}
