import { format, isValid, parseISO } from "date-fns"

/**
 * Helpers for AI-extracted logbook entries that may target a specific calendar day.
 * Times in forms and AI prompts use the device local clock; server fallbacks use Europe/Berlin.
 */

export const APP_TIMEZONE = "Europe/Berlin"

const YMD = /^\d{4}-\d{2}-\d{2}$/
const LOCAL_NOW_LABEL = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/

/** Local calendar date for the user's browser (Munich if the device is set to Germany). */
export function formatLocalYmd(date = new Date()): string {
  return format(date, "yyyy-MM-dd")
}

/** Local date + time label for AI prompts — never use toISOString() here (that is UTC). */
export function formatLocalDateTimeLabel(date = new Date()): string {
  return format(date, "yyyy-MM-dd HH:mm")
}

/** Europe/Berlin date+time (used on the server when the client omits nowLocal). */
export function formatBerlinDateTimeLabel(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

export function resolveNowLabelForExtract(body: {
  nowLocal?: string
  nowIso?: string
}): string {
  const local = typeof body.nowLocal === "string" ? body.nowLocal.trim() : ""
  if (LOCAL_NOW_LABEL.test(local)) return local
  if (typeof body.nowIso === "string" && body.nowIso.length >= 10) {
    const d = new Date(body.nowIso)
    if (!Number.isNaN(d.getTime())) return formatBerlinDateTimeLabel(d)
  }
  return formatBerlinDateTimeLabel()
}

/**
 * Parse model "timestamp" into entry date/time fields.
 * Local "YYYY-MM-DDTHH:mm" is kept as-is; Z/offset strings are converted to local clock fields.
 */
export function parseModelTimestampFields(
  timestamp: unknown,
  todayYmd: string
): { entryDate: string; entryTime?: string } {
  if (typeof timestamp !== "string" || timestamp.length < 10) {
    return { entryDate: todayYmd }
  }
  const ts = timestamp.trim()
  if (ts.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(ts)) {
    const d = parseISO(ts)
    if (isValid(d)) {
      return {
        entryDate: format(d, "yyyy-MM-dd"),
        entryTime: format(d, "HH:mm"),
      }
    }
  }
  const entryDate = ts.slice(0, 10)
  const entryTime =
    ts.includes("T") && ts.length >= 16 ? ts.slice(11, 16) : undefined
  return { entryDate, entryTime }
}

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
