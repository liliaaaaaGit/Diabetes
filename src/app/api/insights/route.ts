import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import { getConversations, getEntries } from "@/lib/db"
import { getWeeklyStats, getEntryCountsByType, getMoodTrend } from "@/lib/stats"
import { getSessionUserId } from "@/lib/auth-session"
import type { GlucoseEntry, MoodEntry } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `Du bist ein Diabetes-Insights-Assistent. Analysiere Gesprächszusammenfassungen und Tagebuchdaten, generiere personalisierte Einblicke.

Generiere als JSON:
{
  "patterns": [
    {
      "title": "Kurzer Titel",
      "description": "2-3 Sätze Beschreibung des erkannten Musters. MUSS enden mit: 'Besprich Muster mit deinem Behandlungsteam.'",
      "category": "glucose|meals|mood|activity|general",
      "confidence": 0.0-1.0
    }
  ],
  "goals": [
    {
      "title": "Zieltitel",
      "description": "Was der Nutzer diese Woche ausprobieren könnte",
      "targetDays": 7
    }
  ],
  "motivation": {
    "quote": "Ein ermutigender Satz basierend auf den besprochenen Themen",
    "context": "Warum dieser Spruch relevant ist"
  }
}

WICHTIGE REGELN:
- Goals NIEMALS: Dosierung ändern, Medikamente anpassen, Gewicht verlieren
- Goals STATTDESSEN: Beobachten, reflektieren, Muster wahrnehmen, Gefühle dokumentieren
- Jedes Pattern MUSS enden mit: "Besprich Muster mit deinem Behandlungsteam."
- Maximal 5 Patterns, 2 Goals, 1 Motivation
- Patterns müssen auf tatsächlichen Daten basieren, nicht erfunden sein
- Goals müssen sanft und reflexiv sein, KEINE medizinischen Ziele
- Motivation muss sich auf tatsächlich besprochene Themen beziehen
- Alle Texte auf Deutsch
- Wenn zu wenig Daten: sage das ehrlich ("Noch zu wenig Daten für zuverlässige Muster")`

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY || !openai) {
      console.error("[api/insights] Missing OPENAI_API_KEY")
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const userId = await getSessionUserId()
    if (!userId) {
      return new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch conversations and entries
    const conversations = await getConversations(userId)
    const entries = await getEntries(userId)

    // Filter ended conversations with summaries
    const endedConvs = conversations.filter((c) => !c.isActive && c.summary)
    const conversationSummaries = endedConvs
      .slice(0, 10) // Last 10 conversations
      .map((c) => `- ${c.summary} (Tags: ${c.tags.join(", ")})`)
      .join("\n")

    // Calculate stats
    const stats = getWeeklyStats(entries)
    const entryCounts = getEntryCountsByType(entries)
    const glucoseEntries = entries.filter((e) => e.type === "glucose") as GlucoseEntry[]
    const moodEntries = entries.filter((e) => e.type === "mood") as MoodEntry[]
    const moodTrend = getMoodTrend(moodEntries)

    // Build entry stats string
    const entryStats = `
Durchschnittlicher Blutzucker: ${stats.avgGlucose} mg/dL (${stats.glucoseCount} Messungen)
Time in Range: ${stats.timeInRange}%
Durchschnittliche Stimmung: ${stats.avgMood.toFixed(1)}/5 (${stats.moodCount} Einträge)
Stimmungstrend: ${moodTrend === "improving" ? "verbessert" : moodTrend === "declining" ? "verschlechtert" : "stabil"}
Aktivitätsminuten: ${stats.activityMinutes}
Einträge gesamt: ${stats.totalEntries}
Einträge nach Typ: Glucose ${entryCounts.glucose}, Insulin ${entryCounts.insulin}, Mahlzeiten ${entryCounts.meal}, Aktivitäten ${entryCounts.activity}, Stimmung ${entryCounts.mood}
`

    // Check if we have enough data
    if (endedConvs.length < 3 && entries.length < 10) {
      return new Response(
        JSON.stringify({
          patterns: [],
          goals: [],
          motivation: {
            quote: "Sammle mehr Daten, um personalisierte Einblicke zu erhalten.",
            context: "Führe ein paar Gespräche mit deinem Diabetes-Buddy und tracke deine Werte.",
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const userPrompt = `Gesprächsdaten:
${conversationSummaries || "Keine Gespräche vorhanden."}

Tagebuchdaten:
${entryStats}

Generiere personalisierte Insights basierend auf diesen Daten.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    })

    const content = completion.choices?.[0]?.message?.content ?? "{}"
    let parsed: {
      patterns?: Array<{
        title: string
        description: string
        category: string
        confidence?: number
      }>
      goals?: Array<{
        title: string
        description: string
        targetDays?: number
      }>
      motivation?: {
        quote: string
        context: string
      }
    }

    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error("[api/insights] JSON parse error:", parseError)
      console.error("[api/insights] Content was:", content)
      return new Response(
        JSON.stringify({ code: "parse_error", patterns: [], goals: [], motivation: { quote: "", context: "" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Ensure patterns end with the required disclaimer
    const patterns = (parsed.patterns || []).map((p) => ({
      ...p,
      description: p.description.endsWith("Besprich Muster mit deinem Behandlungsteam.")
        ? p.description
        : `${p.description} Besprich Muster mit deinem Behandlungsteam.`,
    }))

    return new Response(
      JSON.stringify({
        patterns: patterns.slice(0, 5),
        goals: (parsed.goals || []).slice(0, 2),
        motivation: parsed.motivation || { quote: "", context: "" },
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (e) {
    console.error("[api/insights] Error:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ code: "insights_failed", error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
