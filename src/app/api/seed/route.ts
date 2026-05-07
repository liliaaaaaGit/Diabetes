import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { reseedMockDataForUser } from "@/lib/seed-mock-data"

export const runtime = "nodejs"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not available in production" }, { status: 403 })
  }

  try {
    const store = await cookies()
    const userId = store.get("gc_user_id")?.value

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
