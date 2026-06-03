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
import type { Locale } from "@/i18n/config"
import { AI_FALLBACKS, aiOutputLanguageDirective, resolveAppLocale } from "@/lib/app-locale"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function buildCorrelationSystem(locale: Locale): string {
  const base =
    locale === "en"
      ? `You are an empathetic diabetes coach. You receive blood glucose and mood data for the selected period (daily averages, individual readings, personal target range).

Write a short interpretation in 3–5 sentences in English. It must:
1) name one concrete observation (e.g. time of day, weekday, recurring highs or lows, relation to target range, notable mood days) — no generic statements without data.
2) include no medical recommendations — no insulin, medication, or therapy suggestions, no dosing.
3) be appreciative and non-judgmental.
4) end with a reflection prompt (e.g. "What do you think might be behind that?").
5) honestly note if the data basis is too small (with a concrete number, e.g. "With only X days of both glucose and mood, a pattern isn't clear yet.").

Address the user as "you". Use only the provided data. No opener like "Here is your analysis". Do not repeat a technical AI disclaimer (shown separately in the app).`
      : `Du bist ein empathischer Diabetes-Coach. Du erhältst die Blutzuckerwerte und Stimmungsdaten einer Person mit Diabetes aus dem gewählten Zeitraum (tägliche Mittelwerte, Einzelmessungen, persönlicher Zielbereich).

Erstelle eine kurze Einordnung in 3 bis 5 Sätzen auf Deutsch. Die Einordnung muss:
1) eine konkrete beobachtete Auffälligkeit nennen (z. B. Tageszeit, Wochentag, wiederkehrende Hoch- oder Tiefwerte, Bezug zum Zielbereich, auffällige Stimmungstage) — keine Allgemeinplätze ohne Bezug zu den übergebenen Daten.
2) ohne medizinische Empfehlung auskommen — keine Insulin-, Medikamenten- oder Therapievorschläge, keine Dosierung.
3) wertschätzend und nicht wertend formuliert sein.
4) am Ende einen Reflexionsimpuls geben (z. B. „Was glaubst du, woran das liegen könnte?“).
5) ehrlich kennzeichnen, wenn die Datenbasis zu klein ist (mit konkreter Zahl, z. B. „Mit nur X Tagen mit Blutzucker und Stimmung lässt sich noch kein Muster erkennen.“).

Sprich die Person IMMER mit Du an, niemals mit Sie. Nutze nur die übergebenen Daten. Keine Einleitung wie „Hier ist deine Auswertung“. Einen technischen KI-Disclaimer am Ende nicht wiederholen (wird in der App separat angezeigt).`

  return `${base}\n\n${aiOutputLanguageDirective(locale)}`
}

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let timeRange: InsightsTimeRangeKey = "7d"
  let locale: Locale = "de"
  try {
    const body = (await req.json()) as { timeRange?: InsightsTimeRangeKey; locale?: string }
    locale = resolveAppLocale(body.locale)
    if (body.timeRange === "7d" || body.timeRange === "30d" || body.timeRange === "3m") {
      timeRange = body.timeRange
    }
  } catch {
    /* default */
  }

  const fallback = AI_FALLBACKS.moodGlucoseCorrelation[locale]

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
    return NextResponse.json({ summary: fallback })
  }

  const { targetMinMgDl, targetMaxMgDl } = await getOrCreateUserSettings(userId)
  const chartLocale = locale === "en" ? "en" : "de"
  const points = buildDailyMoodGlucosePoints(range, entries, conversations, chartLocale)

  const glucoseReadings = entries.filter((e) => e.type === "glucose").length
  const moodEntries = entries.filter((e) => e.type === "mood").length
  const convWithEmotion = conversations.filter((c) => !c.isActive && c.emotions).length
  const daysWithBoth = points.filter((p) => p.avgGlucose != null && p.mood != null).length

  const tooLittle =
    glucoseReadings < 3 || moodEntries + convWithEmotion < 2 || daysWithBoth < 2

  if (tooLittle || !openai || !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ summary: fallback })
  }

  const periodLabel =
    locale === "en"
      ? timeRange === "7d"
        ? "7 days"
        : timeRange === "30d"
          ? "30 days"
          : "90 days (3 months)"
      : timeRange === "7d"
        ? "7 Tage"
        : timeRange === "30d"
          ? "30 Tage"
          : "90 Tage (3 Monate)"

  const weekdayLocale = locale === "en" ? "en-US" : "de-DE"
  const compact = points.map((p) => ({
    date: p.dateKey,
    weekday: new Date(`${p.dateKey}T12:00:00`).toLocaleDateString(weekdayLocale, {
      weekday: "long",
    }),
    glucose_mg_dl: p.avgGlucose,
    mood_1_to_5: p.mood,
  }))

  const userPrompt =
    locale === "en"
      ? `Period: last ${periodLabel}.
Glucose target range: ${targetMinMgDl}–${targetMaxMgDl} mg/dL.
Data basis: ${glucoseReadings} glucose readings, ${moodEntries} mood log entries, ${convWithEmotion} ended Gluco conversations with mood analysis, ${daysWithBoth} days with both glucose and mood.

Write the interpretation (3–5 sentences, "you"). Mention at least one concrete detail from the daily data (date, weekday, values). Avoid generic wording without data reference.

Daily data (JSON):
${JSON.stringify(compact, null, 2)}`
      : `Zeitraum: letzte ${periodLabel}.
Zielbereich Blutzucker: ${targetMinMgDl}–${targetMaxMgDl} mg/dL.
Datenbasis: ${glucoseReadings} Blutzuckermessungen, ${moodEntries} Stimmungseinträge im Tagebuch, ${convWithEmotion} abgeschlossene Gluco-Gespräche mit Stimmungsanalyse, ${daysWithBoth} Tage mit sowohl Blutzucker- als auch Stimmungswert.

Erstelle die Einordnung (3–5 Sätze, Du-Form). Nenne mindestens ein konkretes Detail aus den Tagesdaten (Datum, Wochentag, Werte). Vermeide generische Formulierungen ohne Datenbezug.

Tagesdaten (JSON):
${JSON.stringify(compact, null, 2)}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildCorrelationSystem(locale) },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.5,
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ summary: fallback })
    }

    return NextResponse.json({ summary: text })
  } catch (e) {
    console.error("[api/insights/correlation] openai", e)
    return NextResponse.json({ summary: fallback })
  }
}
