import { NextResponse } from "next/server"
import { openai } from "@/lib/openai-server"
import { getSessionUserId } from "@/lib/auth-session"
import { getEntries, getConversations } from "@/lib/db"
import { getOrCreateUserSettings } from "@/lib/user-settings"
import {
  buildDailyMoodGlucosePoints,
  computeInsightsRange,
  type InsightsTimeRangeKey,
} from "@/lib/insights-aggregate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_DE =
  "Sammle mehr Stimmungs- und Blutzuckerdaten, um Zusammenhänge zu erkennen."

const SYSTEM = `Du bist ein empathischer Diabetes-Coach. Du erhältst die Blutzuckerwerte und Stimmungsdaten einer Person mit Diabetes aus dem gewählten Zeitraum (tägliche Mittelwerte, Einzelmessungen, persönlicher Zielbereich).

Erstelle eine kurze Einordnung in 3 bis 5 Sätzen auf Deutsch. Sie muss:
1) eine konkrete beobachtete Auffälligkeit nennen (z. B. Tageszeit, Wochentag, wiederkehrende Hoch- oder Tiefwerte, Bezug zum Zielbereich, auffällige Stimmungstage) — keine Allgemeinplätze ohne Bezug zu den übergebenen Daten.
2) ohne medizinische Empfehlung auskommen — keine Insulin-, Medikamenten- oder Therapievorschläge, keine Dosierung.
3) wertschätzend und nicht wertend formuliert sein.
4) am Ende einen Reflexionsimpuls geben (z. B. „Was glauben Sie, woran das liegen könnte?“).
5) ehrlich kennzeichnen, wenn die Datenbasis zu klein ist (mit konkreter Zahl, z. B. „Mit nur X Tagen mit Blutzucker und Stimmung lässt sich noch kein Muster erkennen.“).

Schreibe in der Sie-Form, genderneutral. Nutzen Sie nur die übergebenen Daten. Keine Einleitung wie „Hier ist Ihre Auswertung“. Einen technischen KI-Disclaimer am Ende nicht wiederholen (wird in der App separat angezeigt).`

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let timeRange: InsightsTimeRangeKey = "7d"
  try {
    const body = (await req.json()) as { timeRange?: InsightsTimeRangeKey }
    if (body.timeRange === "7d" || body.timeRange === "30d" || body.timeRange === "3m") {
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

  const { targetMinMgDl, targetMaxMgDl } = await getOrCreateUserSettings(userId)
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

  const periodLabel =
    timeRange === "7d" ? "7 Tage" : timeRange === "30d" ? "30 Tage" : "90 Tage (3 Monate)"

  const compact = points.map((p) => ({
    datum: p.dateKey,
    wochentag: new Date(`${p.dateKey}T12:00:00`).toLocaleDateString("de-DE", {
      weekday: "long",
    }),
    bz_mg_dl: p.avgGlucose,
    stimmung_1_bis_5: p.mood,
  }))

  const userPrompt = `Zeitraum: letzte ${periodLabel}.
Zielbereich Blutzucker: ${targetMinMgDl}–${targetMaxMgDl} mg/dL.
Datenbasis: ${glucoseReadings} Blutzuckermessungen, ${moodEntries} Stimmungseinträge im Tagebuch, ${convWithEmotion} abgeschlossene Buddy-Gespräche mit Stimmungsanalyse, ${daysWithBoth} Tage mit sowohl Blutzucker- als auch Stimmungswert.

Erstellen Sie die Einordnung (3–5 Sätze, Sie-Form). Nennen Sie mindestens ein konkretes Detail aus den Tagesdaten (Datum, Wochentag, Werte). Vermeiden Sie generische Formulierungen ohne Datenbezug.

Tagesdaten (JSON):
${JSON.stringify(compact, null, 2)}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.5,
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
