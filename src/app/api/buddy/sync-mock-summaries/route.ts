import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { patchMockConversationSummaries } from "@/lib/seed-mock-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Push canonical mock summaries into the DB for the logged-in user (by title). */
export async function POST() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
    }

    const result = await patchMockConversationSummaries(userId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[api/buddy/sync-mock-summaries]", error)
    return NextResponse.json({ success: false, error: "sync_failed" }, { status: 500 })
  }
}
