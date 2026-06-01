import { NextResponse } from "next/server"
import { reseedAllUsersMockData, reseedMockDataForUser } from "@/lib/seed-mock-data"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
// Reseeding every account inserts ~10k rows per user, so give it room to finish.
export const maxDuration = 300

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not available in production" }, { status: 403 })
  }

  try {
    // ?all=true (or ?scope=all) reseeds every account; otherwise just the
    // currently logged-in user.
    const url = new URL(request.url)
    const all = url.searchParams.get("all") === "true" || url.searchParams.get("scope") === "all"

    if (all) {
      const result = await reseedAllUsersMockData()
      return NextResponse.json({ success: true, scope: "all", ...result })
    }

    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    const result = await reseedMockDataForUser(userId)
    return NextResponse.json({ success: true, scope: "user", ...result })
  } catch (error) {
    console.error("[api/seed] Failed:", error)
    return NextResponse.json({ success: false, error: "Seed fehlgeschlagen" }, { status: 500 })
  }
}
