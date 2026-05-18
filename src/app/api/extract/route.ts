import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { openai } from "@/lib/openai-server"
import { EXTRACT_SYSTEM_PROMPT } from "@/lib/extract-meal-prompt"
import { parseExtractResponse } from "@/lib/extract-parse"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    }

    if (!openai || !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ code: "openai_missing" }, { status: 503 })
    }

    const body = (await req.json()) as { text?: string; todayYmd?: string }
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : ""
    const todayYmd =
      typeof body.todayYmd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.todayYmd)
        ? body.todayYmd
        : new Date().toISOString().slice(0, 10)

    if (!text) {
      return NextResponse.json({ entries: [], message: "" })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Heutiges Datum (YYYY-MM-DD): ${todayYmd}\n\nFreitext:\n${text}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ entries: [], message: "" })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error("[api/extract] Invalid JSON from model:", content.slice(0, 200))
      return NextResponse.json({ code: "parse_failed" }, { status: 502 })
    }

    const { entries, message } = parseExtractResponse(parsed, text, todayYmd)
    return NextResponse.json({ entries, message })
  } catch (error) {
    console.error("[api/extract] Error:", error)
    return NextResponse.json({ code: "extract_failed" }, { status: 500 })
  }
}
