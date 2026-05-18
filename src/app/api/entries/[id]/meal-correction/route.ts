import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { updateMealCorrection } from "@/lib/meal-db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 })

    const body = (await req.json()) as { correctedKh?: number }
    const correctedKh = Number(body.correctedKh)
    if (!Number.isFinite(correctedKh) || correctedKh < 0 || correctedKh > 500) {
      return NextResponse.json({ code: "invalid" }, { status: 400 })
    }

    const entry = await updateMealCorrection(userId, params.id, Math.round(correctedKh))
    return NextResponse.json({ entry })
  } catch (e) {
    console.error("[api/entries/meal-correction] PATCH:", e)
    return NextResponse.json({ code: "failed" }, { status: 500 })
  }
}
