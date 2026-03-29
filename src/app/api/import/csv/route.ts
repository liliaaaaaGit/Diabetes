import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createEntry } from "@/lib/db"
import type { CsvImportRowPayload } from "@/lib/csv-import"
import {
  GLUCOSE_RANGE,
  INSULIN_RANGE,
  CARBS_RANGE,
  CSV_IMPORT_MEAL_DESCRIPTION,
} from "@/lib/constants"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BATCH = 80

function isReasonableIsoTimestamp(iso: string): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const y = d.getFullYear()
  return y >= 1990 && y <= 2100
}

function validateGlucose(v: number): boolean {
  return v >= GLUCOSE_RANGE.min && v <= GLUCOSE_RANGE.max
}

function validateInsulin(v: number): boolean {
  return v > 0 && v <= INSULIN_RANGE.max
}

function validateCarbs(v: number): boolean {
  return v > 0 && v <= CARBS_RANGE.max
}

export async function POST(req: Request) {
  const userId = cookies().get("gc_user_id")?.value
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const rows = (body as { rows?: CsvImportRowPayload[] }).rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows_required" }, { status: 400 })
  }

  if (rows.length > MAX_BATCH) {
    return NextResponse.json({ error: "batch_too_large", max: MAX_BATCH }, { status: 400 })
  }

  let glucose = 0
  let insulin = 0
  let meal = 0
  let rowErrors = 0

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") {
      rowErrors++
      continue
    }

    const ts = typeof raw.timestamp === "string" ? raw.timestamp : ""
    if (!isReasonableIsoTimestamp(ts)) {
      rowErrors++
      continue
    }

    let createdSomething = false

    const g = raw.glucose
    if (g != null && typeof g === "number" && validateGlucose(g)) {
      try {
        await createEntry(userId, {
          type: "glucose",
          timestamp: ts,
          source: "import",
          value: g,
          unit: "mg_dl",
          context: "other",
        })
        glucose++
        createdSomething = true
      } catch {
        /* continue with other metrics */
      }
    }

    const ins = raw.insulin
    if (ins != null && typeof ins === "number" && validateInsulin(ins)) {
      try {
        await createEntry(userId, {
          type: "insulin",
          timestamp: ts,
          source: "import",
          dose: ins,
          insulinType: "other",
        })
        insulin++
        createdSomething = true
      } catch {
        /* continue */
      }
    }

    const c = raw.carbs
    if (c != null && typeof c === "number" && validateCarbs(c)) {
      try {
        await createEntry(userId, {
          type: "meal",
          timestamp: ts,
          source: "import",
          description: CSV_IMPORT_MEAL_DESCRIPTION,
          mealType: "snack",
          carbsGrams: c,
        })
        meal++
        createdSomething = true
      } catch {
        /* continue */
      }
    }

    if (!createdSomething) {
      rowErrors++
    }
  }

  return NextResponse.json({
    glucose,
    insulin,
    meal,
    rowErrors,
    totalEntries: glucose + insulin + meal,
  })
}
