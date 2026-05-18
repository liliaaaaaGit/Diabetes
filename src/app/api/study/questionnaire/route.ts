import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import {
  getQuestionnaireResponse,
  upsertQuestionnaireResponse,
} from "@/lib/questionnaire"
import type { QuestionnairePatch } from "@/lib/questionnaire-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const response = await getQuestionnaireResponse(userId)
    return NextResponse.json({ response })
  } catch (e) {
    console.error("[api/study/questionnaire] GET:", e)
    return NextResponse.json({ error: "load_failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as QuestionnairePatch & {
      lastSection?: string
    }

    const patch: QuestionnairePatch = { ...body }
    if (body.lastSection && ["A", "B", "C", "D", "E", "F", "G", "H"].includes(body.lastSection)) {
      patch.lastSection = body.lastSection as QuestionnairePatch["lastSection"]
    }

    const response = await upsertQuestionnaireResponse(userId, patch)
    return NextResponse.json({ response })
  } catch (e) {
    console.error("[api/study/questionnaire] PATCH:", e)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}
