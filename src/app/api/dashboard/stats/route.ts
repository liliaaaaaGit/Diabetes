import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    }

    const stats = await getDashboardStats(userId)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[api/dashboard/stats] Error:", error)
    return NextResponse.json({ code: "dashboard_stats_failed" }, { status: 500 })
  }
}

