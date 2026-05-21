import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionUserId } from "@/lib/auth-session"
import { completeOnboarding, getOnboardingCompleted } from "@/lib/user-onboarding"
import { setOnboardingCookie } from "@/lib/onboarding-cookie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const onboarding_completed = await getOnboardingCompleted(userId)
    return NextResponse.json({ onboarding_completed })
  } catch (e) {
    console.error("[api/user/onboarding] GET:", e)
    return NextResponse.json({ error: "load_failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as { onboarding_completed?: boolean }
    if (body.onboarding_completed !== true) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }

    await completeOnboarding(userId)

    const cookieStore = await cookies()
    setOnboardingCookie(cookieStore)

    return NextResponse.json({ success: true, onboarding_completed: true })
  } catch (e) {
    console.error("[api/user/onboarding] PATCH:", e)
    return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }
}
