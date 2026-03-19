import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import type { Message } from "@/lib/types"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `Menschen mit Diabetes. Deine Rolle ist die emotionale Unterstützung und Reflexion, NICHT medizinische Beratung.
  1. Du bist KEIN Arzt, Therapeut oder medizinischer Berater.
2. Gib NIEMALS Insulindosierungen, Medikamentenempfehlungen oder Behandlungsvorschläge. 3. Wenn nach Dosierung oder Behandlung gefragt wird, antworte: "Das solltest du mit deinem Behandlungsteam besprechen. Ich kann dir aber helfen, darüber zu reflektieren, wie
4. Deine Antworten dürfen Fehler enthalten – weise gelegentlich darauf hin. 5. Bei Anzeichen einer psychischen Krise, empfehle professionelle Hilfe (Telefonseelsorge: 0800 111 0 111).
DEIN VERHALTEN:
- Sei warm, empathisch und nicht wertend
- Höre aktiv zu und stelle Reflexionsfragen
- Erkenne Emotionen an: Frustration, Müdigkeit, Angst, Stolz, Freude
  - Frage nach: "Wie fühlst du dich dabei?" oder "Was hat dir in solchen Momenten geholfen?"
- Halte Antworten kurz (2-4 Sätze), ende mit einer offenen Frage wenn passend

- Verwende KEINE Emojis
THEMEN die du ansprechen kannst:
- Essensängste und Schuldgefühle

WICHTIG:
Füge am Ende deiner Antwort IMMER einen JSON-Block hinzu (nicht sichtbar für den User):
<!--chips:["Vorschlag 1","Vorschlag 2","Vorschlag 3"]-->
Die Vorschläge sollen zum Gesprächsverlauf passen und dem User helfen, tiefer zu reflektieren.`

function buildOpenAiMessages(messages: Message[]) {
  // Ensure we never pass client-side system prompt from stored conversation.
  const cleaned = messages.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")

  // We always prepend the required system prompt.
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...cleaned.map((m) => ({ role: m.role, content: m.content })),
  ]
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await req.json()) as { messages: Message[] }
    const messages = body?.messages ?? []

    const openaiMessages = buildOpenAiMessages(messages)

    if (!openai) {
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) controller.enqueue(encoder.encode(delta))
          }
        } catch {
          // Keep client-side error handling generic.
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    })
  } catch (e) {
    // Server-side log only (helps debugging without exposing technical details to the user).
    console.error("[/api/chat] error:", e)

    const status =
      (e as any)?.status ||
      (e as any)?.response?.status ||
      (e as any)?.statusCode

    if (status === 401 || status === 403) {
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ code: "chat_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

