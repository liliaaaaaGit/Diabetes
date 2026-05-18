import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { completeQuestionnaireResponse } from "@/lib/questionnaire"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const response = await completeQuestionnaireResponse(userId)
    return NextResponse.json({ response })
  } catch (e) {
    console.error("[api/study/questionnaire/complete] POST:", e)
    return NextResponse.json({ error: "complete_failed" }, { status: 500 })
  }
}
