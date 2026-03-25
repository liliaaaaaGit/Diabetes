import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import type { ExtractedEntry } from "@/lib/types"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `Du bist ein intelligenter Daten-Extraktions-Assistent fuer eine Diabetes-Tagebuch-App. Deine KERNKOMPETENZ: Du erkennst Diabetes-relevante Daten in natuerlicher Sprache und SCHAETZT fehlende Werte basierend auf Ernaehrungswissen.

WICHTIGSTE REGEL: Du musst NICHT auf exakte Angaben warten. Wenn jemand "Breze" schreibt, SCHAETZE die Kohlenhydrate. Wenn jemand "mir gehts scheisse" schreibt, erkenne die Stimmung. Sei intelligent, nicht rigid.

EXTRAHIERE FOLGENDE DATENTYPEN:
glucose: { value: number, unit: "mg_dl"|"mmol_l", context: "fasting"|"pre_meal"|"post_meal"|"bedtime"|"other" }
insulin: { dose: number, insulinType: "rapid"|"long_acting"|"mixed"|"other", insulinName: string|null }
meal: { description: string, carbsGrams: number, mealType: "breakfast"|"lunch"|"dinner"|"snack", estimated: boolean }
activity: { activityType: string, durationMinutes: number|null, intensity: "low"|"medium"|"high" }
mood: { moodValue: 1|2|3|4|5, note: string|null }

STIMMUNGS-ERKENNUNG (1=sehr schlecht, 5=sehr gut):
- "scheisse"/"miserabel"/"furchtbar"/"am Ende" = 1
- "schlecht"/"genervt"/"frustriert"/"gestresst" = 2
- "ok"/"geht so"/"normal"/"naja" = 3
- "gut"/"zufrieden"/"entspannt" = 4
- "super"/"fantastisch"/"richtig gut"/"gluecklich" = 5

LEBENSMITTEL-DATENBANK (Kohlenhydrate in Gramm, IMMER schaetzen!):
Backwaren:
Breze/Brezel=48, Semmel/Broetchen=28, Scheibe Brot=20, Croissant=25, Laugenbroetchen=35, Toast (1 Scheibe)=14, Vollkornbrot (1 Scheibe)=22, Baguette (Stueck)=30
Hauptgerichte:
Portion Nudeln (gekocht)=50, Portion Reis (gekocht)=40, Pizza (1 Stueck)=35, ganze Pizza=110, Doener=50, Schnitzel mit Pommes=60, Kartoffelpueree (Portion)=30, Kartoffeln (Portion)=30, Lasagne (Portion)=45, Sushi (8 Stueck)=55, Burger=35, Pommes (Portion)=40
Fruehstueck:
Muesli mit Milch=45, Porridge=35, Cornflakes mit Milch=40, Pancakes (3 Stueck)=50, Joghurt mit Fruechten=25, Nutellabrot=30
Snacks:
Apfel=15, Banane=25, Orange=12, Weintrauben (Handvoll)=15, Schokoriegel=30, Keks (1 Stueck)=10, Kuchen (1 Stueck)=40, Eis (Kugel)=20, Muffin=35, Chips (Tuete)=50
Getraenke:
Cola/Limo 330ml=35, Saft 200ml=22, Bier 500ml=15, Bier 330ml=10, Milch 250ml=12, Kakao=25, Smoothie=30, Energy Drink=28

WENN EIN LEBENSMITTEL NICHT IN DER LISTE IST: Schaetze trotzdem! Setze estimated=true und confidence=0.7

REGELN:
- Wenn unklar ob mg/dL oder mmol/L: Werte >30 = mg/dL, Werte <30 = mmol/L
- "BZ" = Blutzucker, "KH" = Kohlenhydrate, "E" oder "IE" = Insulin-Einheiten
- "NovoRapid", "Fiasp", "Humalog", "Apidra" = rapid
- "Lantus", "Tresiba", "Levemir", "Toujeo" = long_acting
- Erkenne MEHRERE Eintraege aus einer Nachricht
- "nuechtern" / "morgens vor dem Essen" = fasting
- "nach dem Essen" / "2h nach" / "postprandial" = post_meal
- Confidence >= 0.6, sonst nicht zurueckgeben
- Tageszeit beachten: morgens = breakfast, mittags = lunch, abends = dinner
- Bei kombinierten Nachrichten (Essen + Stimmung + BZ) ALLE Teile extrahieren

BEISPIELE:
Input: "mir gehts beschissen, hab ne breze gegessen und mein bz war 180"
Output: entries mit mood(1), meal(Breze, 48g, estimated=true), glucose(180, mg_dl, other)

Input: "heute morgen nuechtern 95, dann 4 einheiten novorapid zum fruehstueck"
Output: entries mit glucose(95, fasting), insulin(4, rapid, NovoRapid)

Input: "hatte pizza und cola zum mittag, danach 240"
Output: entries mit meal(Pizza, 35g, lunch, estimated), meal(Cola, 35g, lunch, estimated), glucose(240, post_meal)

Antworte IMMER als JSON:
{
  "entries": [
    {
      "type": "meal",
      "data": { "description": "Breze", "carbsGrams": 48, "mealType": "snack", "estimated": true },
      "confidence": 0.9,
      "sourceText": "ne breze gegessen"
    }
  ],
  "message": "Breze (~48g KH geschaetzt), Stimmung und BZ erkannt. Stimmt das so?"
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
      temperature: 0.2,
      max_tokens: 600,
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

