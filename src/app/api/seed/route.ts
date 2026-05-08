import { NextResponse } from "next/server"
import { reseedMockDataForUser } from "@/lib/seed-mock-data"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not available in production" }, { status: 403 })
  }

  try {
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    const result = await reseedMockDataForUser(userId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[api/seed] Failed:", error)
    return NextResponse.json({ success: false, error: "Seed fehlgeschlagen" }, { status: 500 })
  }
}
