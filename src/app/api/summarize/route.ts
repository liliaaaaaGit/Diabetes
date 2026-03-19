import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import type { Message } from "@/lib/types"

export const runtime = "nodejs"

const SUMMARY_PROMPT = `Fasse zusammen, was der NUTZER in diesem Gespräch geteilt hat - seine Gefühle, Erfahrungen und Themen. Fasse NICHT zusammen, was der Assistent geantwortet hat. Schreibe aus der dritten Person: "Sprach über...", "Teilte Gefühle von...". Antworte als JSON: { title: string, summary: string, tags: string[], moodEmoji: string }. Regeln: title max 5 Wörter, summary max 2 Sätze.`

export async function POST(req: NextRequest) {
  try {
    const apiKeyMissing = !process.env.OPENAI_API_KEY || !openai
    if (apiKeyMissing) {
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await req.json()) as { messages: Message[] }
    const messages = body?.messages ?? []

    const conversationText = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n")

    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 250,
      temperature: 0.3,
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: conversationText || "(empty)" },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices?.[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(content) as {
      title: string
      summary: string
      tags: string[]
      moodEmoji: string
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    // Never expose technical errors.
    return new Response(
      JSON.stringify({ code: "summarize_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

