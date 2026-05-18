import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { openai } from "@/lib/openai-server"
import { ANALYZE_PHOTO_SYSTEM_PROMPT } from "@/lib/analyze-photo-prompt"
import { parsePhotoAnalysisResponse } from "@/lib/parse-photo-analysis"
import {
  assertPhotoAnalysisAllowed,
  recordPhotoAnalysis,
} from "@/lib/photo-analysis-rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 4 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    }

    if (!openai || !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ code: "openai_missing" }, { status: 503 })
    }

    const { allowed } = await assertPhotoAnalysisAllowed(userId)
    if (!allowed) {
      return NextResponse.json({ code: "rate_limited" }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get("image")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ code: "no_image" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ code: "invalid_image" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ code: "image_too_large" }, { status: 400 })
    }

    const mimeType = file.type || "image/jpeg"
    const base64 = buffer.toString("base64")

    // No pseudonym, user id, or other PII sent to OpenAI — image + system prompt only.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYZE_PHOTO_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analysiere diese Mahlzeit für mein Diabetes-Tagebuch." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ code: "empty_response" }, { status: 502 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error("[api/diary/analyze-photo] Invalid JSON:", content.slice(0, 200))
      return NextResponse.json({ code: "parse_failed" }, { status: 502 })
    }

    await recordPhotoAnalysis(userId)

    const result = parsePhotoAnalysisResponse(parsed)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/diary/analyze-photo] Error:", error)
    return NextResponse.json({ code: "analyze_failed" }, { status: 500 })
  }
}
