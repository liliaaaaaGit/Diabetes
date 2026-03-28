import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { openai } from "@/lib/openai-server"
import type { EntryType, ExtractedEntry } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ENTRY_TYPES: EntryType[] = ["glucose", "insulin", "meal", "activity", "mood"]

const SYSTEM_PROMPT = `Du bist Ernaehrungs- und Diabetes-Experte mit Zugriff auf umfassendes Wissen zu Lebensmitteln, Sport und Stimmung. Du extrahierst aus Freitext ALLE erkennbaren Tagebuch-Eintraege fuer eine Diabetes-App.

KERNREGELN:
- Nutze dein eigenes Ernaehrungs- und Alltagswissen: Schaetze Kohlenhydrate (g) fuer JEDES genannte Essen/Trinken — auch ungewoehnliche Mengen (z.B. "2 Kilo Steak" ~0g KH, "500g Schokoeis" ~130g KH, "Spaghetti Bolognese" ~55g KH, "Breze mit Butter" ~50g KH). NIEMALS sagen du koenntest nicht schaetzen; IMMER eine Zahl liefern.
- Extrahiere ALLE erkennbaren Infoteile aus EINER Nachricht: mehrere Mahlzeiten, BZ, Insulin, Aktivitaet, Stimmung — nichts weglassen wenn es im Text steht.
- Jeder Eintrag hat ein Pflichtfeld "type" (siehe unten) plus "data", "confidence" (0.6-1), "sourceText" (exaktes Zitat/Teilstring aus der User-Nachricht).

FUENF ENTRY-TYPEN UND DATA-SCHEMATA:

1) type "glucose"
   data: { value: number, unit: "mg_dl"|"mmol_l", context: "fasting"|"pre_meal"|"post_meal"|"bedtime"|"other" }

2) type "insulin"
   data: { dose: number, insulinType: "rapid"|"long_acting"|"mixed"|"other", insulinName: string|null }

3) type "meal"
   data: { description: string, carbsGrams: number, mealType: "breakfast"|"lunch"|"dinner"|"snack", estimated: boolean }
   Setze estimated IMMER true wenn du KH schaetzt (fast immer). Nur false wenn der User die Grammzahl explizit nennt.

4) type "activity"
   data: { activityType: string, durationMinutes: number|null, intensity: "low"|"medium"|"high" }
   Beispiele: joggen/laufen, spazieren, Spaziergang, Rad fahren, Gym/Krafttraining, schwimmen. Dauer aus "30 min", "eine Stunde" ableiten; ohne Dauer null und moderate Intensity.

5) type "mood"
   data: { moodValue: 1|2|3|4|5 }
   Mappe umgangssprachliches Deutsch auf 1-5:
   - 1: scheisse, beschissen, miserabel, furchtbar, am Ende
   - 2: schlecht, genervt, frustriert, gestresst
   - 3: ok, geht so, naja, normal
   - 4: gut, zufrieden, entspannt
   - 5: super, wunderbar, mega, fantastisch, richtig gut, gluecklich

WEITERE REGELN:
- BZ-Einheiten: Werte >30 eher mg_dl, <30 eher mmol_l wenn nicht klar.
- "BZ", "Blutzucker", "nuechtern" -> glucose; "nuechtern" oft context fasting.
- "KH" = Kohlenhydrate in Gramm; "E"/"IE" = Insulin-Einheiten.
- NovoRapid/Fiasp/Humalog/Apidra -> rapid; Lantus/Tresiba/Levemir/Toujeo -> long_acting.
- Tageszeit: morgens breakfast, mittags lunch, abends dinner (wenn keine Mahlzeit genannt).
- Confidence mindestens 0.6 sonst weglassen.

TEST-LOGIK (intern): "2 kilo steak, 500g schokoeis, mir gehts wunderbar, 30 min joggen" -> 4 Eintraege: 2x meal, 1x mood(5), 1x activity.
"120 nuechtern, 4 novorapid, ne banane, war spazieren" -> glucose, insulin, meal, activity.

Antworte NUR als JSON-Objekt:
{
  "entries": [
    {
      "type": "meal",
      "data": { "description": "...", "carbsGrams": 0, "mealType": "dinner", "estimated": true },
      "confidence": 0.85,
      "sourceText": "..."
    }
  ],
  "message": "Kurze freundliche Bestaetigung auf Deutsch."
}`

function normalizeExtractedType(raw: unknown): EntryType | undefined {
  const s = typeof raw === "string" ? raw.toLowerCase().trim() : ""
  return ENTRY_TYPES.includes(s as EntryType) ? (s as EntryType) : undefined
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("gc_user_id")?.value
    if (!userId) {
      return new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

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
      temperature: 0.2,
      max_tokens: 800,
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
      .map((e) => {
        const type = normalizeExtractedType(e.type)
        const data = { ...(e.data ?? {}) }

        if (type === "meal") {
          if (data.estimated === undefined && typeof data.carbsGrams === "number") {
            data.estimated = true
          }
        }

        return {
          type,
          sourceText: String(e.sourceText ?? ""),
          data,
          confidence: Number(e.confidence),
          included: true,
        }
      })

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
