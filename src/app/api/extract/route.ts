import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { openai } from "@/lib/openai-server"
import { buildExtractSystemPrompt } from "@/lib/extract-meal-prompt"
import { resolveAppLocale } from "@/lib/app-locale"
import { formatBerlinDateTimeLabel, resolveNowLabelForExtract } from "@/lib/entry-timestamp"
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

    const body = (await req.json()) as {
      text?: string
      todayYmd?: string
      locale?: string
      /** Local "YYYY-MM-DD HH:mm" from the user's device — preferred. */
      nowLocal?: string
      /** @deprecated UTC ISO; converted to Europe/Berlin if nowLocal is missing. */
      nowIso?: string
    }
    const locale = resolveAppLocale(body.locale)
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : ""
    const todayYmd =
      typeof body.todayYmd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.todayYmd)
        ? body.todayYmd
        : formatBerlinDateTimeLabel().slice(0, 10)
    const nowLabel = resolveNowLabelForExtract(body)

    if (!text) {
      return NextResponse.json({ entries: [], message: "" })
    }

    const userPrompt =
      locale === "en"
        ? `Today's date (YYYY-MM-DD): ${todayYmd}\nCurrent local time (YYYY-MM-DD HH:mm): ${nowLabel}\n\nFree text:\n${text}`
        : `Heutiges Datum (YYYY-MM-DD): ${todayYmd}\nAktuelle lokale Zeit (YYYY-MM-DD HH:mm): ${nowLabel}\n\nFreitext:\n${text}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractSystemPrompt(locale) },
        { role: "user", content: userPrompt },
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
