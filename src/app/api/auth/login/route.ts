import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pseudonym: string; pin: string }
    const { pseudonym, pin } = body

    if (!pseudonym || !pin) {
      return NextResponse.json({ success: false, error: "Pseudonym und PIN sind erforderlich" }, { status: 400 })
    }

    // Find user
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, pseudonym, pin_hash, failed_login_attempts, locked_until, consent_given")
      .eq("pseudonym", pseudonym.trim())
      .maybeSingle()

    if (findError) {
      console.error("[auth/login] Error finding user:", findError)
      return NextResponse.json({ success: false, error: "Datenbankfehler" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Pseudonym oder PIN falsch" }, { status: 401 })
    }

    // Check if account is locked
    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until)
      const now = new Date()
      if (lockedUntil > now) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60))
        return NextResponse.json(
          { success: false, error: `Zu viele Versuche. Bitte warte ${minutesLeft} Minuten.` },
          { status: 429 }
        )
      }
      // Lock expired, reset it
      await supabase.from("users").update({ locked_until: null, failed_login_attempts: 0 }).eq("id", user.id)
    }

    // Verify PIN
    if (!user.pin_hash) {
      return NextResponse.json({ success: false, error: "Konto nicht korrekt konfiguriert" }, { status: 500 })
    }

    const pinMatch = await bcrypt.compare(pin, user.pin_hash)

    if (!pinMatch) {
      // Increment failed attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock account
        const lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES)

        await supabase
          .from("users")
          .update({ failed_login_attempts: newAttempts, locked_until: lockedUntil.toISOString() })
          .eq("id", user.id)

        return NextResponse.json(
          { success: false, error: `Zu viele Versuche. Bitte warte ${LOCK_DURATION_MINUTES} Minuten.` },
          { status: 429 }
        )
      } else {
        await supabase.from("users").update({ failed_login_attempts: newAttempts }).eq("id", user.id)
      }

      return NextResponse.json({ success: false, error: "Pseudonym oder PIN falsch" }, { status: 401 })
    }

    // Success: reset failed attempts and set cookies
    await supabase.from("users").update({ failed_login_attempts: 0, locked_until: null }).eq("id", user.id)

    const cookieStore = await cookies()
    cookieStore.set("gc_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })
    cookieStore.set("gc_pseudonym", user.pseudonym, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    if (user.consent_given) {
      cookieStore.set("gc_consent", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      })
    } else {
      cookieStore.delete("gc_consent")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth/login] Error:", error)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}
