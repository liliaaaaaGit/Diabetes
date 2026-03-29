/**
 * Helpers for AI-extracted logbook entries that may target a specific calendar day.
 */

const YMD = /^\d{4}-\d{2}-\d{2}$/

/** True if string is YYYY-MM-DD and the calendar date exists in the local timezone. */
export function isValidDateYmd(ymd: string): boolean {
  if (!YMD.test(ymd)) return false
  const [y, m, d] = ymd.split("-").map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * ISO timestamp for persisting an entry: "now", or the given local calendar day
 * with the user's current local time-of-day (so late-night logging still feels natural).
 */
export function timestampForEntryDate(ymd: string | undefined | null): string {
  if (ymd == null || ymd === "" || !isValidDateYmd(ymd)) {
    return new Date().toISOString()
  }
  const [y, m, d] = ymd.split("-").map(Number)
  const now = new Date()
  const local = new Date(
    y,
    m - 1,
    d,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  )
  return local.toISOString()
}
