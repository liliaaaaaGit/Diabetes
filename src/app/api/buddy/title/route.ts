import { openai } from "@/lib/openai-server"
import { updateConversationTitle } from "@/lib/db"

export const runtime = "nodejs"

function fallbackTitle(firstMessage: string) {
  const trimmed = firstMessage.trim()
  if (!trimmed) return "Neues Gespräch"
  return `${trimmed.slice(0, 40)}...`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { conversationId?: string; firstMessage?: string }
    const conversationId = body.conversationId?.trim()
    const firstMessage = body.firstMessage?.trim() || ""

    if (!conversationId) {
      return Response.json({ title: "Neues Gespräch" }, { status: 400 })
    }

    let title = fallbackTitle(firstMessage)

    if (openai && firstMessage) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.5,
          max_tokens: 20,
          messages: [
            {
              role: "system",
              content:
                "Generiere einen kurzen Titel (max 5 Woerter) fuer dieses Diabetes-Gespraech basierend auf der ersten Nachricht. Nur der Titel, nichts anderes. Auf Deutsch.",
            },
            { role: "user", content: firstMessage },
          ],
        })
        const generated = completion.choices?.[0]?.message?.content?.trim()
        if (generated) title = generated.slice(0, 60)
      } catch {
        // keep fallback
      }
    }

    await updateConversationTitle(conversationId, title)
    return Response.json({ title })
  } catch (error) {
    console.error("[api/buddy/title] Error:", error)
    return Response.json({ title: "Neues Gespräch" }, { status: 500 })
  }
}
