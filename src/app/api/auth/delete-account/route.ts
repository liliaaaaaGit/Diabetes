import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("gc_user_id")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    // Delete all user data (cascade will handle related records)
    // First, delete entries (which will cascade to type-specific tables)
    await supabase.from("entries").delete().eq("user_id", userId)

    // Delete conversations (which will cascade to messages)
    await supabase.from("conversations").delete().eq("user_id", userId)

    // Delete insights
    await supabase.from("insights").delete().eq("user_id", userId)

    // Delete goals
    await supabase.from("goals").delete().eq("user_id", userId)

    // Finally, delete the user
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      console.error("[auth/delete-account] Error deleting user:", deleteError)
      return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
    }

    // Clear cookies
    cookieStore.delete("gc_access")
    cookieStore.delete("gc_user_id")
    cookieStore.delete("gc_pseudonym")
    cookieStore.delete("gc_consent")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth/delete-account] Error:", error)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}
