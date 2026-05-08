import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    // Clear all auth cookies
    cookieStore.delete("gc_access")
    cookieStore.delete("gc_user_id")
    cookieStore.delete("gc_pseudonym")
    cookieStore.delete("gc_consent")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth/logout] Error:", error)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}
