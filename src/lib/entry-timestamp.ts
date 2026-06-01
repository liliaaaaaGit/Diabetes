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

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** True if string is a valid 24h "HH:mm" time. */
export function isValidTimeHhmm(hhmm: string): boolean {
  return HHMM.test(hhmm)
}

/**
 * ISO timestamp for a specific local calendar day + time-of-day.
 * Falls back to the current date/time for any missing or invalid part.
 */
export function timestampForEntryDateTime(
  ymd: string | undefined | null,
  hhmm: string | undefined | null
): string {
  const now = new Date()
  const validDate = ymd != null && ymd !== "" && isValidDateYmd(ymd)
  const validTime = hhmm != null && hhmm !== "" && isValidTimeHhmm(hhmm)

  const [y, m, d] = validDate
    ? (ymd as string).split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  const [hh, mm] = validTime
    ? (hhmm as string).split(":").map(Number)
    : [now.getHours(), now.getMinutes()]

  const local = new Date(y, m - 1, d, hh, mm, 0, 0)
  return local.toISOString()
}
