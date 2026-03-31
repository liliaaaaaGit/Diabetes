import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"

const CONSENT_COOKIE = "gc_consent"
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

/**
 * Speichert die ausdrückliche Einwilligung nach Registrierung (DB + Session-Cookie).
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("gc_user_id")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from("users")
      .update({ consent_given: true, consent_date: now })
      .eq("id", userId)

    if (error) {
      console.error("[auth/consent] Update failed:", error)
      return NextResponse.json({ success: false, error: "Speichern fehlgeschlagen" }, { status: 500 })
    }

    cookieStore.set(CONSENT_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[auth/consent] Error:", e)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}
