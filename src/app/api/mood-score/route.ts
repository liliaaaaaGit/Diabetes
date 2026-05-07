import { NextRequest } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { scoreMoodText } from "@/lib/mood-score"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = (await req.json()) as { text?: string }
    const text = typeof body?.text === "string" ? body.text : ""
    const moodValue = await scoreMoodText(text)

    return new Response(JSON.stringify({ moodValue }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[api/mood-score] Error:", error)
    return new Response(JSON.stringify({ moodValue: 3 }), {
      headers: { "Content-Type": "application/json" },
    })
  }
}

