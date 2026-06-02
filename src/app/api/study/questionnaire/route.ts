import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import {
  getQuestionnaireResponse,
  upsertQuestionnaireResponse,
} from "@/lib/questionnaire"
import type { QuestionnairePatch, QuestionnaireSectionId } from "@/lib/questionnaire-types"

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

    const body = (await req.json()) as { section?: QuestionnaireSectionId } & QuestionnairePatch
    const patch: QuestionnairePatch = {}
    if (body.sectionA) patch.sectionA = body.sectionA
    if (body.sectionB) patch.sectionB = body.sectionB
    if (body.sectionC) patch.sectionC = body.sectionC
    if (body.sectionD) patch.sectionD = body.sectionD
    if (body.sectionE) patch.sectionE = body.sectionE
    if (body.sectionF) patch.sectionF = body.sectionF
    if (body.sectionG) patch.sectionG = body.sectionG

    const response = await upsertQuestionnaireResponse(userId, patch)
    return NextResponse.json({ response })
  } catch (e) {
    console.error("[api/study/questionnaire] PATCH:", e)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}
