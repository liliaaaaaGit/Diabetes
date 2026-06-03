import { openai } from "@/lib/openai-server"
import { getRecentEndedConversationSummaries } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"
import { AI_FALLBACKS, aiOutputLanguageDirective, parseLocaleFromRequest } from "@/lib/app-locale"
import { localizeSummaryForLocale } from "@/lib/mock-conversation-locale"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const locale = parseLocaleFromRequest(req)
    const fallback = AI_FALLBACKS.buddyQuote[locale]

    const summaries = (
      await getRecentEndedConversationSummaries(userId, { limit: 3 })
    ).map((s) => localizeSummaryForLocale(s, locale))

    if (summaries.length === 0 || !openai) {
      return Response.json({ quote: fallback })
    }

    const block = summaries
      .map((s, i) => `${i + 1}. ${s.dateLabel} — ${s.title}: ${s.summary}`)
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
            "You write for a diabetes companion app. Generate ONE short personalized quote or impulse in exactly 2–3 sentences based on themes and feelings from recent conversation summaries. Warm, encouraging, empathetic — no medical advice, no kitsch, no clichés like 'you've got this'. " +
            aiOutputLanguageDirective(locale) +
            ' Reply only as JSON: { "quote": string }',
        },
        {
          role: "user",
          content: `Recent conversation summaries:\n\n${block}`,
        },
      ],
    })

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as { quote?: string }
    const quote = (parsed.quote || "").trim()
    return Response.json({ quote: quote || fallback })
  } catch (error) {
    console.error("[api/buddy/quote] Error:", error)
    const locale = parseLocaleFromRequest(req)
    return Response.json({ quote: AI_FALLBACKS.buddyQuote[locale] })
  }
}
