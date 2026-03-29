import { openai } from "@/lib/openai-server"
import { createGoal, getConversations, getGoals, updateGoalProgress } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PREFIX = "BUDDY_DAILY::"

const todayKey = () => new Date().toISOString().slice(0, 10)

const fallbackGoals = [
  "Nenne heute einen kleinen Erfolg.",
  "Atme 3 Mal bewusst tief ein.",
  "Schreib auf, was dir gut tat.",
]

function toResponseGoals(goals: Array<{ id: string; title: string; completedDays: number }>) {
  return goals.map((g) => ({ id: g.id, text: g.title, completed: g.completedDays > 0 }))
}

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const day = todayKey()
    const allGoals = await getGoals(userId)
    const todays = allGoals.filter((g) => g.description.startsWith(`${PREFIX}${day}::`)).slice(0, 3)

    if (todays.length > 0) {
      return Response.json({ goals: toResponseGoals(todays) })
    }

    const conversations = await getConversations(userId)
    const context = conversations
      .filter((c) => !c.isActive && c.summary)
      .slice(0, 5)
      .map((c) => {
        const tagStr = (c.tags || []).map((t) => `${t.emoji} ${t.label}`).join(", ")
        return `Summary: ${c.summary}; Tags: ${tagStr}`
      })
      .join("\n")

    const generatedTexts = async () => {
      if (!openai) return fallbackGoals
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Du generierst 3 kleine, machbare Tagesaufgaben fuer emotionales Selbstmanagement bei Diabetes. Die Aufgaben sollen auf den letzten Gespraechen basieren. Sie sollen KEINE medizinischen Aufgaben sein (keine Dosierung, keine Messung). Stattdessen: Reflexion, Achtsamkeit, soziale Verbindung, Selbstfuersorge. Kurz und knapp (max 8 Woerter pro Aufgabe). Antworte als JSON: { goals: [{ text: string }] }. Auf Deutsch.",
          },
          { role: "user", content: `Letzte Gespraeche: ${context || "Keine Daten vorhanden."}` },
        ],
      })
      const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}") as {
        goals?: Array<{ text?: string }>
      }
      const cleaned = (parsed.goals || [])
        .map((g) => (g.text || "").trim())
        .filter(Boolean)
        .slice(0, 3)
      return cleaned.length === 3 ? cleaned : fallbackGoals
    }

    const texts = await generatedTexts()
    const created = await Promise.all(
      texts.map((text) =>
        createGoal({
          userId,
          title: text,
          description: `${PREFIX}${day}::${text}`,
          targetDays: 1,
          active: true,
        })
      )
    )

    return Response.json({ goals: toResponseGoals(created) })
  } catch (error) {
    console.error("[api/buddy/goals] Error:", error)
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
