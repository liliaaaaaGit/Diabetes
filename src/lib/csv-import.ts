/**
 * CSV parsing, column auto-mapping, and building import payloads (runs in the browser
 * so Datum/Zeit use the user's local timezone).
 */

import { GLUCOSE_RANGE, INSULIN_RANGE, CARBS_RANGE } from "@/lib/constants"

export type CsvColumnRole =
  | "ignore"
  | "timestamp"
  | "timestamp_date"
  | "timestamp_time"
  | "glucose"
  | "insulin"
  | "carbs"

/** One logical row after mapping: timestamp + optional metrics */
export interface CsvImportRowPayload {
  timestamp: string
  glucose?: number
  insulin?: number
  carbs?: number
}

export interface CsvParsed {
  columns: string[]
  rows: string[][] // data rows only (no header)
}

const MAX_CSV_BYTES = 5 * 1024 * 1024

/** Split one CSV line; supports quoted fields with delimiter inside. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (c === delimiter && !inQuotes) {
      out.push(cur.trim())
      cur = ""
      continue
    }
    cur += c
  }
  out.push(cur.trim())
  return out
}

export function detectDelimiter(sampleLine: string): string {
  const commas = (sampleLine.match(/,/g) || []).length
  const semis = (sampleLine.match(/;/g) || []).length
  return semis > commas ? ";" : ","
}

function uniquifyHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((h) => {
    const base = h.trim() || "Spalte"
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base} (${n})`
  })
}

/**
 * Map a header label to a role (case-insensitive, normalized spaces).
 */
export function autoMapColumnName(header: string): CsvColumnRole {
  const n = header.trim().toLowerCase().replace(/\s+/g, " ")

  if (n === "datum" || n === "date") return "timestamp_date"
  if (n === "zeit" || n === "time") return "timestamp_time"

  if (
    n.includes("blood glucose") ||
    n.includes("blood sugar") ||
    n === "blutzucker" ||
    n === "bz" ||
    n === "glucose"
  ) {
    return "glucose"
  }

  if (n === "kh" || n.includes("kohlenhydrate") || n === "carbs" || n === "carbohydrates") {
    return "carbs"
  }

  if (n.includes("insulin")) return "insulin"

  if (
    n.includes("zeitstempel") ||
    n === "timestamp" ||
    n.includes("date time") ||
    n === "datetime"
  ) {
    return "timestamp"
  }

  return "ignore"
}

export function buildAutoMapping(columns: string[]): Record<string, CsvColumnRole> {
  const m: Record<string, CsvColumnRole> = {}
  for (const c of columns) {
    m[c] = autoMapColumnName(c)
  }
  return m
}

export function parseLocaleNumber(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "")
  if (!t) return null
  const normalized = t.replace(",", ".")
  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  return n
}

function parseDateParts(s: string): { y: number; m: number; d: number } | null {
  const t = s.trim()
  if (!t) return null

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { y, m, d }
  }

  const de = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(t)
  if (de) {
    let d = Number(de[1])
    let m = Number(de[2])
    let y = Number(de[3])
    if (y < 100) y += 2000
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { y, m, d }
  }

  return null
}

function parseTimeParts(s: string): { h: number; min: number; sec: number } | null {
  const t = s.trim()
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  const sec = m[3] ? Number(m[3]) : 0
  if (h >= 0 && h <= 23 && min >= 0 && min <= 59 && sec >= 0 && sec <= 59) {
    return { h, min, sec }
  }
  return null
}

/**
 * Combine date + time in the user's local timezone to ISO string.
 */
export function resolveTimestampISO(
  fullTs: string,
  dateStr: string,
  timeStr: string
): string | null {
  const full = fullTs.trim()
  if (full) {
    const d = new Date(full)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
    const parts = full.split(/[\sT]+/)
    if (parts.length >= 2) {
      const dp = parseDateParts(parts[0])
      const tp = parseTimeParts(parts.slice(1).join(" "))
      if (dp && tp) {
        const d2 = new Date(dp.y, dp.m - 1, dp.d, tp.h, tp.min, tp.sec)
        if (!Number.isNaN(d2.getTime())) return d2.toISOString()
      }
    }
  }

  const dp = parseDateParts(dateStr)
  const tp = parseTimeParts(timeStr)

  if (dp && tp) {
    const d = new Date(dp.y, dp.m - 1, dp.d, tp.h, tp.min, tp.sec)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  if (dp && !timeStr.trim()) {
    const d = new Date(dp.y, dp.m - 1, dp.d, 0, 0, 0)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  return null
}

function extractFieldsFromRow(
  row: string[],
  columns: string[],
  mapping: Record<string, CsvColumnRole>
) {
  let fullTs = ""
  let dateStr = ""
  let timeStr = ""
  let glucose: number | undefined
  let insulin: number | undefined
  let carbs: number | undefined

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]
    const role = mapping[col] ?? "ignore"
    const cell = (row[i] ?? "").trim()

    switch (role) {
      case "timestamp":
        if (cell && !fullTs) fullTs = cell
        break
      case "timestamp_date":
        if (cell && !dateStr) dateStr = cell
        break
      case "timestamp_time":
        if (cell && !timeStr) timeStr = cell
        break
      case "glucose": {
        const n = parseLocaleNumber(cell)
        if (
          n != null &&
          glucose === undefined &&
          n >= GLUCOSE_RANGE.min &&
          n <= GLUCOSE_RANGE.max
        ) {
          glucose = n
        }
        break
      }
      case "insulin": {
        const n = parseLocaleNumber(cell)
        if (
          n != null &&
          insulin === undefined &&
          n >= INSULIN_RANGE.min &&
          n <= INSULIN_RANGE.max
        ) {
          insulin = n
        }
        break
      }
      case "carbs": {
        const n = parseLocaleNumber(cell)
        if (
          n != null &&
          carbs === undefined &&
          n >= CARBS_RANGE.min &&
          n <= CARBS_RANGE.max
        ) {
          carbs = n
        }
        break
      }
      default:
        break
    }
  }

  return { fullTs, dateStr, timeStr, glucose, insulin, carbs }
}

export function rowToImportPayload(
  row: string[],
  columns: string[],
  mapping: Record<string, CsvColumnRole>
): CsvImportRowPayload | null {
  const { fullTs, dateStr, timeStr, glucose, insulin, carbs } = extractFieldsFromRow(
    row,
    columns,
    mapping
  )

  const ts = resolveTimestampISO(fullTs, dateStr, timeStr)
  if (!ts) return null

  const hasMetric =
    glucose != null ||
    (insulin != null && insulin > 0) ||
    (carbs != null && carbs > 0)
  if (!hasMetric) return null

  const payload: CsvImportRowPayload = { timestamp: ts }
  if (glucose != null) payload.glucose = glucose
  if (insulin != null && insulin > 0) payload.insulin = insulin
  if (carbs != null && carbs > 0) payload.carbs = carbs
  return payload
}

export function mappingSupportsTimestamp(mapping: Record<string, CsvColumnRole>): boolean {
  const roles = Object.values(mapping)
  const hasFull = roles.includes("timestamp")
  const hasDate = roles.includes("timestamp_date")
  const hasTime = roles.includes("timestamp_time")
  if (hasFull) return true
  if (hasDate && hasTime) return true
  if (hasDate && !hasTime) return true
  return false
}

export function buildImportPayloads(
  columns: string[],
  dataRows: string[][],
  mapping: Record<string, CsvColumnRole>
): CsvImportRowPayload[] {
  const out: CsvImportRowPayload[] = []
  for (const row of dataRows) {
    const padded = [...row]
    while (padded.length < columns.length) padded.push("")
    const payload = rowToImportPayload(padded, columns, mapping)
    if (payload) out.push(payload)
  }
  return out
}

export function parseCsvFileContents(text: string): CsvParsed | null {
  const normalizedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const lines = normalizedText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return null

  const delim = detectDelimiter(lines[0])
  const headerCells = splitCsvLine(lines[0], delim).map((c) => c.trim().replace(/^\uFEFF/, ""))
  if (headerCells.length === 0 || headerCells.every((c) => !c)) return null

  const columns = uniquifyHeaders(headerCells)
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim)
    const padded = [...cells]
    while (padded.length < columns.length) padded.push("")
    rows.push(padded.slice(0, columns.length))
  }

  return { columns, rows }
}

export async function parseCsvFile(file: File): Promise<CsvParsed | null> {
  if (file.size > MAX_CSV_BYTES) return null
  const text = await file.text()
  return parseCsvFileContents(text)
}

export const CSV_IMPORT_MAX_BYTES = MAX_CSV_BYTES
