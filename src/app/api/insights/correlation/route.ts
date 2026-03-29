import { NextResponse } from "next/server"
import { openai } from "@/lib/openai-server"
import { getSessionUserId } from "@/lib/auth-session"
import { getEntries, getConversations } from "@/lib/db"
import {
  buildDailyMoodGlucosePoints,
  computeInsightsRange,
  type InsightsTimeRangeKey,
} from "@/lib/insights-aggregate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_DE =
  "Sammle mehr Stimmungs- und Blutzuckerdaten, um Zusammenhänge zu erkennen."

const SYSTEM = `Du bist ein einfühlsamer Begleiter für Menschen mit Diabetes. Du erhältst täglich gemittelte Blutzuckerwerte (mg/dL) und Stimmungswerte (1–5, aus Tagebuch und Gesprächs-Stimmungsanalyse).

Antworte NUR mit 2–3 kurzen Sätzen auf Deutsch. Keine Diagnose, keine Therapieanweisungen. Nutze „du“. Wenn die Daten keinen klaren Zusammenhang zeigen, sage das vorsichtig und ermutigend.`

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let timeRange: InsightsTimeRangeKey = "7d"
  try {
    const body = (await req.json()) as { timeRange?: InsightsTimeRangeKey }
    if (body.timeRange === "week" || body.timeRange === "7d" || body.timeRange === "30d") {
      timeRange = body.timeRange
    }
  } catch {
    /* default */
  }

  const range = computeInsightsRange(timeRange)
  const fromIso = range.from.toISOString()
  const toIso = range.to.toISOString()

  let entries
  let conversations
  try {
    ;[entries, conversations] = await Promise.all([
      getEntries(userId, { from: fromIso, to: toIso }),
      getConversations(userId),
    ])
  } catch (e) {
    console.error("[api/insights/correlation] load failed", e)
    return NextResponse.json({ summary: FALLBACK_DE })
  }

  const points = buildDailyMoodGlucosePoints(range, entries, conversations, "de")

  const glucoseReadings = entries.filter((e) => e.type === "glucose").length
  const moodEntries = entries.filter((e) => e.type === "mood").length
  const convWithEmotion = conversations.filter((c) => !c.isActive && c.emotions).length
  const daysWithBoth = points.filter((p) => p.avgGlucose != null && p.mood != null).length

  const tooLittle =
    glucoseReadings < 3 ||
    moodEntries + convWithEmotion < 2 ||
    daysWithBoth < 2

  if (tooLittle || !openai || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ summary: FALLBACK_DE })
  }

  const compact = points.map((p) => ({
    tag: p.dateKey,
    bz: p.avgGlucose,
    stimmung: p.mood,
  }))

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Analysiere den Zusammenhang zwischen Blutzuckerwerten und Stimmung. Gibt es Muster? Hier die täglichen Daten (JSON):\n${JSON.stringify(compact)}`,
        },
      ],
      max_tokens: 220,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ summary: FALLBACK_DE })
    }

    return NextResponse.json({ summary: text })
  } catch (e) {
    console.error("[api/insights/correlation] openai", e)
    return NextResponse.json({ summary: FALLBACK_DE })
  }
}
