import { subDays } from "date-fns"
import { openai } from "@/lib/openai-server"
import { getConversations } from "@/lib/db"
import { DEFAULT_USER_ID } from "@/lib/constants"

export const runtime = "nodejs"

const FALLBACK_QUOTE = "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."

export async function GET() {
  try {
    const conversations = await getConversations(DEFAULT_USER_ID)
    const from = subDays(new Date(), 14)
    const tags = conversations
      .filter((c) => !c.isActive && new Date(c.startedAt) >= from)
      .flatMap((c) => c.tags || [])
      .filter(Boolean)

    if (!openai || tags.length === 0) {
      return Response.json({ quote: FALLBACK_QUOTE })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 80,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Generiere einen kurzen, ermutigenden Gedanken des Tages fuer eine Person mit Diabetes. Der Spruch soll sich auf die Themen der letzten Gespraeche beziehen. Kein Kitsch, kein medizinischer Rat. Authentisch und warm. 1-2 Saetze. Auf Deutsch. Antworte als JSON: { quote: string }",
        },
        { role: "user", content: `Themen der letzten Gespraeche: ${tags.join(", ")}` },
      ],
    })

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as { quote?: string }
    return Response.json({ quote: (parsed.quote || "").trim() || FALLBACK_QUOTE })
  } catch (error) {
    console.error("[api/buddy/motivation] Error:", error)
    return Response.json({ quote: FALLBACK_QUOTE })
  }
}
