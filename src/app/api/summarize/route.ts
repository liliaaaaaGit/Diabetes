import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { openai } from "@/lib/openai-server"
import type { ConversationEmotions, ConversationTag, Message } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUMMARY_PROMPT = `You summarize a chat between a user and a diabetes companion (Buddy) for a research app.

Focus on what the USER shared: feelings, worries, wins, relationships, diabetes-related stress — not on rehashing the assistant's advice.

Output a single JSON object with this exact shape:
{
  "title": string,
  "summary": string,
  "tags": [ { "emoji": string, "label": string }, ... ],
  "moodEmoji": string,
  "emotions": {
    "happiness": number,
    "surprise": number,
    "sadness": number,
    "anger": number,
    "fear": number,
    "disgust": number
  }
}

TITLE:
- 3–6 words, creative and evocative (not clinical). For German titles: use normal German capitalization (nouns capitalized). For English: natural title or sentence case.
- Examples (English style): "Creating While Carrying Weight", "When Support Feels Out of Reach"
- Examples (German style): "Wenn der Alltag zu viel wird", "Kleiner Schritt, große Ehrlichkeit"

SUMMARY:
- One warm, empathetic, reflective paragraph: 6–12 sentences — like caring session notes with heart, not a cold clinical abstract.
- For German: write grammatically correct German with correct capitalization and punctuation. Use complete sentences with proper sentence boundaries.
- For English: use normal capitalization, punctuation, and complete sentences.
- Speak directly to the user as "you" (English) or "du" (German) — match the language they used most in the conversation.
- Reflect what they went through, validate feelings, name strengths you genuinely hear, offer a gentle reframe where fitting.
- NOT clinical, NOT third person ("they/the user"), NOT bullet points.

TAGS:
- 3–6 items. Each tag: { "emoji": "<single real Unicode emoji>", "label": "<short theme in same language as summary>" }
- Use actual emoji characters (e.g. 😰), not placeholder words like "emoji_face".

moodEmoji:
- One primary mood Unicode emoji for the overall tone of what the user expressed.

EMOTIONS:
- Score each basic emotion from 0.0 to 1.0 (floats) based on the user's messages. Most chats mix emotions; use nuanced values, not all zeros.

The conversation transcript follows.`

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function normalizeTags(raw: unknown): ConversationTag[] {
  if (!Array.isArray(raw)) return []
  const out: ConversationTag[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ emoji: "·", label: s })
      continue
    }
    if (item && typeof item === "object" && "label" in item) {
      const emoji = String((item as { emoji?: unknown }).emoji ?? "·").trim() || "·"
      const label = String((item as { label?: unknown }).label ?? "").trim()
      if (label) out.push({ emoji, label })
    }
  }
  return out.slice(0, 6)
}

function normalizeEmotions(raw: unknown): ConversationEmotions {
  const base = {
    happiness: 0,
    surprise: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    disgust: 0,
  }
  if (!raw || typeof raw !== "object") return base
  const o = raw as Record<string, unknown>
  return {
    happiness: clamp01(typeof o.happiness === "number" ? o.happiness : Number(o.happiness)),
    surprise: clamp01(typeof o.surprise === "number" ? o.surprise : Number(o.surprise)),
    sadness: clamp01(typeof o.sadness === "number" ? o.sadness : Number(o.sadness)),
    anger: clamp01(typeof o.anger === "number" ? o.anger : Number(o.anger)),
    fear: clamp01(typeof o.fear === "number" ? o.fear : Number(o.fear)),
    disgust: clamp01(typeof o.disgust === "number" ? o.disgust : Number(o.disgust)),
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("gc_user_id")?.value
    if (!userId) {
      return new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

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
      max_tokens: 800,
      temperature: 0.6,
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: conversationText || "(empty)" },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices?.[0]?.message?.content ?? "{}"
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content) as Record<string, unknown>
    } catch {
      return new Response(
        JSON.stringify({ code: "summarize_failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const title = typeof parsed.title === "string" ? parsed.title.trim() : ""
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : ""
    const tags = normalizeTags(parsed.tags)
    const moodEmoji =
      typeof parsed.moodEmoji === "string" && parsed.moodEmoji.trim()
        ? parsed.moodEmoji.trim()
        : "💬"
    const emotions = normalizeEmotions(parsed.emotions)

    const payload = {
      title: title || "untitled thread",
      summary: summary || "…",
      tags,
      moodEmoji,
      emotions,
    }

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return new Response(
      JSON.stringify({ code: "summarize_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
