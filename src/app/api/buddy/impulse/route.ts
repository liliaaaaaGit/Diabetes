import { openai } from "@/lib/openai-server"
import { getConversations } from "@/lib/db"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_IMPULSE = "Wie geht es dir heute mit deinem Diabetes? Lass uns darueber sprechen."

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const conversations = await getConversations(userId)
    const summaries = conversations
      .filter((c) => !c.isActive && c.summary)
      .slice(0, 5)
      .map((c) => c.summary?.trim())
      .filter(Boolean) as string[]

    if (!openai || summaries.length === 0) {
      return Response.json({ impulse: FALLBACK_IMPULSE })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content:
            "Du generierst einen kurzen, einfuehlsamen Tagesimpuls fuer eine Person mit Diabetes. Basierend auf den letzten Gespraechen, formuliere eine einladende Frage oder Reflexion in 1-2 Saetzen. Der Impuls MUSS einen klaren Bezug zum Diabetes-Alltag, zu Diabetes-Emotionen oder zu den letzten Gespraechen haben – vermeide generische Wellness-Floskeln ohne Diabetes-Bezug (keine 'Dankbarkeitspraxis', keine 'Atemuebung'). Sprich die Person IMMER mit 'du' an, niemals mit 'Sie' (verwende du, dein, dir – nie Sie, Ihre, Ihnen). Kein medizinischer Rat, keine Dosierungsempfehlung. Auf Deutsch.",
        },
        { role: "user", content: `Letzte Gespraeche: ${summaries.join(" | ")}` },
      ],
    })

    const impulse = completion.choices?.[0]?.message?.content?.trim() || FALLBACK_IMPULSE
    return Response.json({ impulse })
  } catch (error) {
    console.error("[api/buddy/impulse] Error:", error)
    return Response.json({ impulse: FALLBACK_IMPULSE })
  }
}
