import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { supabaseServer } from "@/lib/supabase-server"
import { getEntries, getConversations, getConversation, getInsights, getGoals } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * DSGVO Art. 20 – Datenportabilitaet
 * Exports the current user's structured data as JSON.
 */
export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Nicht angemeldet" }, { status: 401 })
    }

    const [{ data: userRow, error: userError }, entries, conversationList, insights, goals] = await Promise.all([
      supabaseServer
        .from("users")
        .select("id,pseudonym,preferred_unit,consent_given,consent_date,created_at")
        .eq("id", userId)
        .maybeSingle(),
      getEntries(userId),
      getConversations(userId),
      getInsights(userId),
      getGoals(userId),
    ])

    if (userError) {
      console.error("[auth/export-data] Error loading user:", userError)
      return NextResponse.json({ success: false, error: "Datenbankfehler" }, { status: 500 })
    }

    const conversations = await Promise.all(
      conversationList.map((conversation) => getConversation(conversation.id, userId))
    )

    const payload = {
      exportVersion: 1,
      generatedAt: new Date().toISOString(),
      user_profile: userRow ?? null,
      entries,
      conversations,
      goals,
      insights,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="glucocompanion_export.json"',
      },
    })
  } catch (error) {
    console.error("[auth/export-data] Error:", error)
    return NextResponse.json({ success: false, error: "Serverfehler" }, { status: 500 })
  }
}

