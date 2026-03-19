import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { code: string }
    const providedCode = body?.code?.trim()

    const validCode = process.env.ACCESS_CODE

    if (!validCode) {
      console.error("[auth/verify-code] ACCESS_CODE not set in environment")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    if (!providedCode || providedCode !== validCode) {
      return NextResponse.json({ success: false, error: "Ungültiger Zugangscode" }, { status: 401 })
    }

    // Set access cookie
    const cookieStore = await cookies()
    cookieStore.set("gc_access", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[auth/verify-code] Error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
