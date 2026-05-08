import { NextRequest, NextResponse } from "next/server"
import { getEntries } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"
import type { EntryType } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_TYPES: EntryType[] = ["glucose", "insulin", "meal", "activity", "mood"]

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    }

    const params = req.nextUrl.searchParams
    const rawType = params.get("type")
    const type = rawType && VALID_TYPES.includes(rawType as EntryType) ? (rawType as EntryType) : undefined
    const from = params.get("from") || undefined
    const to = params.get("to") || undefined
    const rawLimit = params.get("limit")
    const limit = rawLimit ? Number(rawLimit) : undefined

    const entries = await getEntries(userId, {
      type,
      from,
      to,
      limit: Number.isFinite(limit) ? limit : undefined,
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("[api/entries] Error:", error)
    return NextResponse.json({ code: "entries_failed" }, { status: 500 })
  }
}

