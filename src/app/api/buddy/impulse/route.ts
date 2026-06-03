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
    const fallback = AI_FALLBACKS.buddyImpulse[locale]

    const conversations = (await getConversations(userId)).map((c) =>
      localizeConversationMeta(c, locale)
    )
    const entries = await getEntries(userId, { limit: 150 })
    const summaries = conversations
      .filter((c) => !c.isActive && c.summary)
      .slice(0, 5)
      .map((c) => c.summary?.trim())
      .filter(Boolean) as string[]

    const recentGlucose = entries.filter((e) => e.type === "glucose").slice(0, 20)
    const highCount = recentGlucose.filter((e: any) => e.value > 180).length
    const lowCount = recentGlucose.filter((e: any) => e.value < 70).length
    const moodNotes = entries
      .filter((e) => e.type === "mood" && e.note)
      .slice(0, 5)
      .map((e) => String((e as any).note).trim())
      .filter(Boolean)

    if (!openai || summaries.length === 0) {
      return Response.json({ impulse: fallback })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content:
            "You generate a short, empathetic daily impulse for a person with diabetes. Based on recent conversations, write an inviting question or reflection in 1–2 sentences. The impulse MUST clearly relate to everyday diabetes, diabetes emotions, or recent chat themes — avoid generic wellness without a diabetes link. No medical advice, no dosing recommendations. " +
            aiOutputLanguageDirective(locale),
        },
        {
          role: "user",
          content:
            `Recent conversations: ${summaries.join(" | ")}\n` +
            `Data context: high readings (${highCount}), low readings (${lowCount}), recent mood notes: ${moodNotes.join(" | ") || "none"}`,
        },
      ],
    })

    const impulse = completion.choices?.[0]?.message?.content?.trim() || fallback
    return Response.json({ impulse })
  } catch (error) {
    console.error("[api/buddy/impulse] Error:", error)
    const locale = parseLocaleFromRequest(req)
    return Response.json({ impulse: AI_FALLBACKS.buddyImpulse[locale] })
  }
}
