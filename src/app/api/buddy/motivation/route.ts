import { subDays } from "date-fns"
import { openai } from "@/lib/openai-server"
import { getConversations, getEntries } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"
import { AI_FALLBACKS, aiOutputLanguageDirective, parseLocaleFromRequest } from "@/lib/app-locale"
import { localizeConversationMeta } from "@/lib/mock-conversation-locale"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const locale = parseLocaleFromRequest(req)
    const fallback = AI_FALLBACKS.buddyMotivation[locale]

    const conversations = (await getConversations(userId)).map((c) =>
      localizeConversationMeta(c, locale)
    )
    const entries = await getEntries(userId, { limit: 200 })
    const from = subDays(new Date(), 14)
    const tags = conversations
      .filter((c) => !c.isActive && new Date(c.startedAt) >= from)
      .flatMap((c) => c.tags || [])
      .map((t) => `${t.emoji} ${t.label}`.trim())
      .filter(Boolean)
    const glucose = entries.filter((e) => e.type === "glucose")
    const highs = glucose.filter((e: any) => e.value > 180).length
    const lows = glucose.filter((e: any) => e.value < 70).length
    const meals = entries.filter((e) => e.type === "meal").length
    const moods = entries.filter((e) => e.type === "mood").length

    if (!openai || tags.length === 0) {
      return Response.json({ quote: fallback })
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
            "Generate a short encouraging thought of the day for a person with diabetes. " +
            "RULES: " +
            "1. The thought MUST clearly relate to everyday diabetes life, diabetes emotions, or themes from recent conversations. " +
            "2. Good examples: 'A high reading after a meal isn't failure — it's a data point you can learn from.' " +
            "3. Bad examples (too generic, NO diabetes link — avoid): 'Start a gratitude practice.' / 'Take 5 minutes to breathe.' " +
            "4. Anti-perfectionism, but always framed around diabetes, not life in general. " +
            "No kitsch, no medical advice, no insulin or dosing recommendations. Authentic and warm. 1–2 sentences. " +
            aiOutputLanguageDirective(locale) +
            ' Reply as JSON: { "quote": string }',
        },
        {
          role: "user",
          content:
            `Themes from recent conversations: ${tags.join(", ")}\n` +
            `Context from recent entries: high readings=${highs}, low readings=${lows}, meals=${meals}, mood entries=${moods}`,
        },
      ],
    })

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as { quote?: string }
    return Response.json({ quote: (parsed.quote || "").trim() || fallback })
  } catch (error) {
    console.error("[api/buddy/motivation] Error:", error)
    const locale = parseLocaleFromRequest(req)
    return Response.json({ quote: AI_FALLBACKS.buddyMotivation[locale] })
  }
}
