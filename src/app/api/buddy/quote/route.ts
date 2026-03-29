import { openai } from "@/lib/openai-server"
import { getRecentEndedConversationSummaries } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_QUOTE =
  "Du bist nicht allein mit dem, was Diabetes emotional mit sich bringt. Ein kleiner, ehrlicher Schritt zählt — genau so, wie du heute unterwegs bist."

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const summaries = await getRecentEndedConversationSummaries(userId, { limit: 3 })

    if (summaries.length === 0 || !openai) {
      return Response.json({ quote: FALLBACK_QUOTE })
    }

    const block = summaries
      .map(
        (s, i) =>
          `${i + 1}. ${s.dateLabel} — ${s.title}: ${s.summary}`
      )
      .join("\n\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du schreibst fuer eine Diabetes-Begleit-App. Erzeuge EIN kurzes, personalisiertes Zitat oder einen Impuls in genau 2 bis 3 Saetzen, das sich auf die Themen und Gefuehle aus den letzten Gespraechs-Zusammenfassungen bezieht. Warm, ermutigend, empathisch — kein medizinischer Rat, kein Kitsch, keine Floskeln wie 'du schaffst das'. Grammatikalisch korrektes Deutsch mit korrekter Gross- und Kleinschreibung. Antworte nur als JSON: { \"quote\": string }",
        },
        {
          role: "user",
          content: `Zusammenfassungen frueherer Gespraeche:\n\n${block}`,
        },
      ],
    })

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as { quote?: string }
    const quote = (parsed.quote || "").trim()
    return Response.json({ quote: quote || FALLBACK_QUOTE })
  } catch (error) {
    console.error("[api/buddy/quote] Error:", error)
    return Response.json({ quote: FALLBACK_QUOTE })
  }
}
