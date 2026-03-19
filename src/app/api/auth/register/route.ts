import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pseudonym: string; pin: string }
    const { pseudonym, pin } = body

    if (!pseudonym || !pin) {
      return NextResponse.json({ success: false, error: "Pseudonym und PIN sind erforderlich" }, { status: 400 })
    }

    // Validate pseudonym
    if (pseudonym.length < 3 || pseudonym.length > 20) {
      return NextResponse.json({ success: false, error: "Pseudonym muss 3-20 Zeichen lang sein" }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9]+$/.test(pseudonym)) {
      return NextResponse.json({ success: false, error: "Pseudonym darf nur Buchstaben und Zahlen enthalten" }, { status: 400 })
    }

    // Validate PIN
    if (pin.length < 4 || pin.length > 6) {
      return NextResponse.json({ success: false, error: "PIN muss 4-6 Ziffern lang sein" }, { status: 400 })
    }
    if (!/^\d+$/.test(pin)) {
      return NextResponse.json({ success: false, error: "PIN darf nur Ziffern enthalten" }, { status: 400 })
    }

    // Check if pseudonym already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("pseudonym", pseudonym.trim())
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found", which is fine
      console.error("[auth/register] Error checking pseudonym:", checkError)
      return NextResponse.json({ success: false, error: "Datenbankfehler" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Dieses Pseudonym ist bereits vergeben. Bitte wähle ein anderes." },
        { status: 409 }
      )
    }

    // Hash PIN
    const saltRounds = 10
    const pinHash = await bcrypt.hash(pin, saltRounds)

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        pseudonym: pseudonym.trim(),
        pin_hash: pinHash,
        consent_given: true,
        consent_date: new Date().toISOString(),
        preferred_unit: "mg_dl",
      })
      .select("id, pseudonym")
      .maybeSingle()

    if (insertError) {
      console.error("[auth/register] Error creating user:", insertError)
      return NextResponse.json({ success: false, error: "Fehler beim Erstellen des Kontos" }, { status: 500 })
    }

    if (!newUser) {
      return NextResponse.json({ success: false, error: "Konto konnte nicht erstellt werden" }, { status: 500 })
    }

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set("gc_user_id", newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })
    cookieStore.set("gc_pseudonym", newUser.pseudonym, {
      httpOnly: false, // Needed for display in UI
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({ success: true, userId: newUser.id })
  } catch (error) {
    console.error("[auth/register] Error:", error)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}
