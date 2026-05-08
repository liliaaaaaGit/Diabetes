import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer as supabase } from "@/lib/supabase-server"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const userId = await getSessionUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    const { data: entryRows, error: entryIdsError } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", userId)
    if (entryIdsError) {
      console.error("[auth/delete-account] Error loading entry ids:", entryIdsError)
      return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
    }
    const entryIds = (entryRows || []).map((row) => row.id)

    const { data: conversationRows, error: conversationIdsError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
    if (conversationIdsError) {
      console.error("[auth/delete-account] Error loading conversation ids:", conversationIdsError)
      return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
    }
    const conversationIds = (conversationRows || []).map((row) => row.id)

    // 1) Delete entry sub-tables (explicit DSGVO deletion order)
    if (entryIds.length > 0) {
      const subTables = [
        "entry_glucose",
        "entry_insulin",
        "entry_meal",
        "entry_mood",
        "entry_activity",
      ] as const

      for (const table of subTables) {
        const { error } = await supabase.from(table).delete().in("entry_id", entryIds)
        if (error) {
          console.error(`[auth/delete-account] Error deleting ${table}:`, error)
          return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
        }
      }
    }

    // 2) Delete messages for user's conversations
    if (conversationIds.length > 0) {
      const { error } = await supabase
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds)
      if (error) {
        console.error("[auth/delete-account] Error deleting messages:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 3) Delete entries
    {
      const { error } = await supabase.from("entries").delete().eq("user_id", userId)
      if (error) {
        console.error("[auth/delete-account] Error deleting entries:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 4) Delete conversations
    {
      const { error } = await supabase.from("conversations").delete().eq("user_id", userId)
      if (error) {
        console.error("[auth/delete-account] Error deleting conversations:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 5) Delete goals
    {
      const { error } = await supabase.from("goals").delete().eq("user_id", userId)
      if (error) {
        console.error("[auth/delete-account] Error deleting goals:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 6) Delete insights
    {
      const { error } = await supabase.from("insights").delete().eq("user_id", userId)
      if (error) {
        console.error("[auth/delete-account] Error deleting insights:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 7) Delete user row
    {
      const { error } = await supabase.from("users").delete().eq("id", userId)
      if (error) {
        console.error("[auth/delete-account] Error deleting user:", error)
        return NextResponse.json({ success: false, error: "Fehler beim Löschen der Daten" }, { status: 500 })
      }
    }

    // 8) Clear auth cookies
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
