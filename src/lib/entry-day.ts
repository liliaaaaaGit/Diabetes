import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns"

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

/**
 * On the selected calendar day that is "today", drop entries after the current clock time.
 * Past days show the full day (including mock data for that date).
 */
export function filterEntriesVisibleForDay<T extends { timestamp: string; id?: string }>(
  entries: T[],
  day: Date,
  now = new Date(),
  /** Just-saved rows stay visible even if the form time is slightly in the future. */
  pinIds?: Iterable<string>
): T[] {
  const pinned = pinIds ? new Set(pinIds) : null
  const dayStart = startOfDay(day)
  if (!isSameDay(dayStart, startOfDay(now))) {
    return entries
  }
  const nowMs = now.getTime()
  return entries.filter((e) => {
    if (pinned?.has(e.id ?? "")) return true
    const ts = parseISO(e.timestamp).getTime()
    return Number.isFinite(ts) && ts <= nowMs
  })
}
