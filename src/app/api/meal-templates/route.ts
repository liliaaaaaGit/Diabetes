import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import {
  createMealTemplate,
  deleteMealTemplate,
  getMealTemplates,
} from "@/lib/meal-db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    const templates = await getMealTemplates(userId)
    return NextResponse.json({ templates })
  } catch (e) {
    console.error("[api/meal-templates] GET:", e)
    return NextResponse.json({ code: "failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    const body = (await req.json()) as { name?: string; description?: string; kh?: number }
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const kh = Number(body.kh)
    if (!name || !Number.isFinite(kh) || kh < 0 || kh > 500) {
      return NextResponse.json({ code: "invalid" }, { status: 400 })
    }
    const template = await createMealTemplate(userId, {
      name,
      description: typeof body.description === "string" ? body.description.trim() : name,
      kh,
    })
    return NextResponse.json({ template })
  } catch (e) {
    console.error("[api/meal-templates] POST:", e)
    return NextResponse.json({ code: "failed" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ code: "invalid" }, { status: 400 })
    await deleteMealTemplate(userId, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/meal-templates] DELETE:", e)
    return NextResponse.json({ code: "failed" }, { status: 500 })
  }
}
