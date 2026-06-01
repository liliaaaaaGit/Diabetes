import { subDays } from "date-fns"
import { openai } from "@/lib/openai-server"
import { getConversations } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_QUOTE = "Du musst heute nicht perfekt sein. Ein ehrlicher, kleiner Schritt reicht."

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const conversations = await getConversations(userId)
    const from = subDays(new Date(), 14)
    const tags = conversations
      .filter((c) => !c.isActive && new Date(c.startedAt) >= from)
      .flatMap((c) => c.tags || [])
      .map((t) => `${t.emoji} ${t.label}`.trim())
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
            "Generiere einen kurzen, ermutigenden Gedanken des Tages fuer eine Person mit Diabetes. " +
            "REGELN: " +
            "1. Der Gedanke MUSS einen klaren Bezug zum Diabetes-Alltag, zu Diabetes-Emotionen oder zu den Themen der letzten Gespraeche haben. " +
            "2. Gute Beispiele: 'Ein hoher Wert nach dem Essen ist kein Versagen – es ist ein Datenpunkt, aus dem du lernen kannst.' / 'Manchmal hilft ein Spaziergang nach dem Essen nicht nur dem Zucker, sondern auch dem Kopf.' " +
            "3. Schlechte Beispiele (zu generisch, KEIN Diabetes-Bezug, vermeide sie): 'Fuehre eine Dankbarkeitspraxis ein.' / 'Nimm dir 5 Minuten fuer eine Atemuebung.' / 'Du bist gut genug, so wie du bist.' " +
            "4. Anti-Perfektionismus, aber immer rund um Diabetes gerahmt, nicht ums Leben allgemein. " +
            "Kein Kitsch, kein medizinischer Rat, keine Insulin- oder Dosierungsempfehlung. Authentisch und warm. 1-2 Saetze. Auf Deutsch. Antworte als JSON: { quote: string }",
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
