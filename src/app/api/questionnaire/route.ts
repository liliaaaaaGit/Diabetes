import { NextRequest } from "next/server"
import { GET as getStudyQuestionnaire, PATCH as patchStudyQuestionnaire } from "@/app/api/study/questionnaire/route"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return getStudyQuestionnaire()
}

export async function PATCH(req: NextRequest) {
  return patchStudyQuestionnaire(req)
}
