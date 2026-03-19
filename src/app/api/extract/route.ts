import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import type { ExtractedEntry } from "@/lib/types"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `Du bist ein Daten-Extraktions-Assistent für eine Diabetes-Tagebuch-App. Deine Aufgabe ist es, aus Freitext strukturierte Tagebucheinträge zu erkennen.

Extrahiere folgende Datentypen wenn vorhanden:
- glucose: { value: number, unit: "mg_dl"|"mmol_l", context: "fasting"|"pre_meal"|"post_meal"|"bedtime"|"other" }
- insulin: { dose: number, insulinType: "rapid"|"long_acting"|"mixed"|"other", insulinName: string|null }
- meal: { description: string, carbsGrams: number, mealType: "breakfast"|"lunch"|"dinner"|"snack" }
- activity: { activityType: string, durationMinutes: number|null, intensity: "low"|"medium"|"high" }
- mood: { moodValue: 1|2|3|4|5 }

Regeln:
- Wenn unklar ob mg/dL oder mmol/L: nimm mg/dL an (Werte >30 sind mg/dL, Werte <30 sind mmol/L)
- "KH" oder "Kohlenhydrate" = Gramm Kohlenhydrate
- "BZ" = Blutzucker
- "NovoRapid", "Humalog" = rapid insulin
- Gib für jeden erkannten Eintrag einen confidence Score (0.0-1.0)
- Nur Einträge mit confidence >= 0.6 zurückgeben
- Wenn nichts erkannt wird: leeres entries Array

Antworte IMMER als JSON im folgenden Format:
{
  "entries": [
    {
      "type": "glucose",
      "data": { "value": 142, "unit": "mg_dl", "context": "post_meal" },
      "confidence": 0.95,
      "sourceText": "BZ 142"
    }
  ],
  "message": "Ich habe 3 Einträge erkannt. Stimmt das so?"
}`

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[api/extract] Missing OPENAI_API_KEY")
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
    if (!openai) {
      console.error("[api/extract] OpenAI client not initialized")
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await req.json()) as { text: string }
    const text = (body?.text ?? "").slice(0, 500)

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ entries: [], message: "" }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    })

    const content = completion.choices?.[0]?.message?.content ?? "{}"
    let parsed: {
      entries: Array<{
        type?: string
        data: any
        confidence: number
        sourceText: string
      }>
      message?: string
    }

    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error("[api/extract] JSON parse error:", parseError)
      console.error("[api/extract] Content was:", content)
      return new Response(
        JSON.stringify({ code: "parse_error", entries: [], message: "" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const entries: ExtractedEntry[] = (parsed.entries ?? [])
      .filter((e) => typeof e?.confidence === "number" && e.confidence >= 0.6)
      .map((e) => ({
        sourceText: String(e.sourceText ?? ""),
        data: e.data ?? {},
        confidence: Number(e.confidence),
        included: true,
      }))

    return new Response(
      JSON.stringify({ entries, message: parsed.message ?? "" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (e) {
    console.error("[api/extract] Error:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ code: "extract_failed", error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

