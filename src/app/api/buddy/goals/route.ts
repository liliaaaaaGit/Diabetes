import { openai } from "@/lib/openai-server"
import { createGoal, getConversations, getGoals, updateGoalProgress } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"
import type { Locale } from "@/i18n/config"
import { AI_FALLBACKS, aiOutputLanguageDirective, parseLocaleFromRequest } from "@/lib/app-locale"
import { localizeConversationMeta } from "@/lib/mock-conversation-locale"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PREFIX = "BUDDY_DAILY::"

const todayKey = () => new Date().toISOString().slice(0, 10)

function isTodaysBuddyGoal(description: string, day: string, locale: Locale): boolean {
  const withLocale = `${PREFIX}${day}::${locale}::`
  if (description.startsWith(withLocale)) return true
  if (locale === "de") {
    const legacy = `${PREFIX}${day}::`
    return description.startsWith(legacy) && !description.startsWith(`${PREFIX}${day}::en::`)
  }
  return false
}

function goalDescription(day: string, locale: Locale, text: string): string {
  return `${PREFIX}${day}::${locale}::${text}`
}

function toResponseGoals(goals: Array<{ id: string; title: string; completedDays: number }>) {
  return goals.map((g) => ({ id: g.id, text: g.title, completed: g.completedDays > 0 }))
}

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const locale = parseLocaleFromRequest(req)
    const fallbackGoals = AI_FALLBACKS.buddyGoals[locale]
    const day = todayKey()
    const allGoals = await getGoals(userId)
    const todays = allGoals.filter((g) => isTodaysBuddyGoal(g.description, day, locale)).slice(0, 3)

    if (todays.length > 0) {
      return Response.json({ goals: toResponseGoals(todays) })
    }

    const conversations = (await getConversations(userId)).map((c) =>
      localizeConversationMeta(c, locale)
    )
    const context = conversations
      .filter((c) => !c.isActive && c.summary)
      .slice(0, 5)
      .map((c) => {
        const tagStr = (c.tags || []).map((t) => `${t.emoji} ${t.label}`).join(", ")
        return `Summary: ${c.summary}; Tags: ${tagStr}`
      })
      .join("\n")

    const generatedTexts = async () => {
      if (!openai) return [...fallbackGoals]
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Generate 3 small, doable daily tasks for emotional self-management with diabetes. Tasks should build on recent conversations. NO medical tasks (no dosing, no measuring). Instead: reflection, mindfulness, social connection, self-care. Short (max 8 words per task). " +
              aiOutputLanguageDirective(locale) +
              ' Reply as JSON: { "goals": [{ "text": string }] }',
          },
          {
            role: "user",
            content: `Recent conversations: ${context || "No data available."}`,
          },
        ],
      })
      const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as {
        goals?: Array<{ text?: string }>
      }
      const cleaned = (parsed.goals || [])
        .map((g) => (g.text || "").trim())
        .filter(Boolean)
        .slice(0, 3)
      return cleaned.length === 3 ? cleaned : [...fallbackGoals]
    }

    const texts = await generatedTexts()
    const created = await Promise.all(
      texts.map((text) =>
        createGoal({
          userId,
          title: text,
          description: goalDescription(day, locale, text),
          targetDays: 1,
          active: true,
        })
      )
    )

    return Response.json({ goals: toResponseGoals(created) })
  } catch (error) {
    console.error("[api/buddy/goals] Error:", error)
    const locale = parseLocaleFromRequest(req)
    const fallbackGoals = AI_FALLBACKS.buddyGoals[locale]
    return Response.json({
      goals: fallbackGoals.map((text, index) => ({ id: `fallback-${index}`, text, completed: false })),
    })
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ success: false, code: "unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as { goalId?: string; completed?: boolean }
    if (!body.goalId) {
      return Response.json({ success: false }, { status: 400 })
    }
    await updateGoalProgress(body.goalId, body.completed ? 1 : 0, userId)
    return Response.json({ success: true })
  } catch (error) {
    console.error("[api/buddy/goals] PATCH error:", error)
    return Response.json({ success: false }, { status: 500 })
  }
}
