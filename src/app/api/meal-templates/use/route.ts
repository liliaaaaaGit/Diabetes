import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { createEntry } from "@/lib/db"
import { supabaseServer as supabase } from "@/lib/supabase-server"
import type { NewEntry } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Create a logbook meal entry from a saved template (no AI call). */
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 })

    const body = (await req.json()) as { templateId?: string }
    const templateId = body.templateId
    if (!templateId) return NextResponse.json({ code: "invalid" }, { status: 400 })

    const { data: tpl, error } = await supabase
      .from("meal_templates")
      .select("name,description,kh")
      .eq("id", templateId)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (!tpl) return NextResponse.json({ code: "not_found" }, { status: 404 })

    const kh = Number(tpl.kh)
    const entry: NewEntry = {
      type: "meal",
      source: "manual",
      timestamp: new Date().toISOString(),
      description: (tpl.description || tpl.name) as string,
      carbsGrams: kh,
      carbsMinGrams: kh,
      carbsMaxGrams: kh,
      carbsConfidence: "high",
      mealType: "snack",
    }

    const created = await createEntry(userId, entry)
    return NextResponse.json({ entry: created })
  } catch (e) {
    console.error("[api/meal-templates/use] POST:", e)
    return NextResponse.json({ code: "failed" }, { status: 500 })
  }
}
