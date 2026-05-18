import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/user-settings"
import type { GlucoseUnit } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const settings = await getOrCreateUserSettings(userId)
    return NextResponse.json({ settings })
  } catch (e) {
    console.error("[api/user/settings] GET:", e)
    return NextResponse.json({ error: "load_failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as {
      preferredUnit?: GlucoseUnit
      targetMinMgDl?: number
      targetMaxMgDl?: number
    }

    if (
      body.preferredUnit != null &&
      body.preferredUnit !== "mg_dl" &&
      body.preferredUnit !== "mmol_l"
    ) {
      return NextResponse.json({ error: "invalid_unit" }, { status: 400 })
    }

    const settings = await updateUserSettings(userId, {
      preferredUnit: body.preferredUnit,
      targetMinMgDl: body.targetMinMgDl,
      targetMaxMgDl: body.targetMaxMgDl,
    })

    return NextResponse.json({ settings })
  } catch (e) {
    console.error("[api/user/settings] PATCH:", e)
    return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }
}
