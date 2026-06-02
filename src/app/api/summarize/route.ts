import { NextRequest } from "next/server"
import { openai } from "@/lib/openai-server"
import type { ConversationEmotions, ConversationTag, Message } from "@/lib/types"
import { getSessionUserId } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUMMARY_PROMPT = `WICHTIG (höchste Priorität):
Für deutsche Titel und Zusammenfassungen: IMMER grammatikalisch korrektes Deutsch mit korrekter Groß- und Kleinschreibung (Substantive groß, Satzanfänge groß, „ich“ klein). NIEMALS den gesamten Titel oder die gesamte Zusammenfassung nur in Kleinbuchstaben schreiben.
Für englische Ausgabe: normale englische Großschreibung (Satzanfänge, „I“ groß).

Du erzeugst eine JSON-Zusammenfassung eines beendeten Chats in einer Diabetes-Begleit-App (Forschungsprototyp). Der Chat enthält Nachrichten von USER und ASSISTANT (Gluco). Lies beide — schreibe die Zusammenfassung aber ausschließlich aus der Perspektive dessen, was der USER erlebt, fühlt und erkannt hat.

Output a single JSON object with this exact shape:
{
  "title": string,
  "summary": string,
  "tags": [ { "emoji": string, "label": string }, ... ],
  "moodEmoji": string,
  "emotions": {
    "happiness": number,
    "surprise": number,
    "sadness": number,
    "anger": number,
    "fear": number,
    "disgust": number
  }
}

TITLE (unverändert zur bisherigen Logik):
- 3–6 words, creative and evocative (not clinical). Match the user's main language.
- German: normal capitalization. English: natural title or sentence case.
- Examples (EN): "Creating While Carrying Weight", "When Support Feels Out of Reach"
- Examples (DE): "Wenn der Alltag zu viel wird", "Kleiner Schritt, große Ehrlichkeit"

SUMMARY — zentrale Regeln:
- Genau 2–4 Sätze. Warm, konkret, menschlich — wie ein Spiegel des eigenen Gesprächs, kein klinischer Bericht, keine Stichpunkte.
- Sprache: die Sprache, die der USER im Chat überwiegend nutzt.
  - Deutsch: IMMER Du-Form (du, dein, dir, dich). NIEMALS Sie/Ihre/Ihnen. NIEMALS dritte Person („der Nutzer“, „die Nutzerin“, „er/sie teilte“).
  - Englisch: direkte „you“-Anrede. NIEMALS „the user“, „they“, „he/she shared“.
- Fokus = nur der USER: wie es ihm/ihr geht, was passiert ist, was er/sie für sich mitgenommen hat.
- NIEMALS Gluco, der Bot, der Assistent oder dessen Verhalten erwähnen — auch nicht lobend oder beschreibend (verboten z. B.: „Gluco bestärkt …“, „Gluco hat gut reagiert“, „the assistant explained …“).
- Wenn im Gespräch vorhanden, herausfiltern (nur was der User wirklich angesprochen hat — nichts erfinden):
  • Ressourcen: Was hilft? (Bewegung, Routinen, Schlaf, Menschen, Dinge, die Werte oder Stimmung stabilisieren.)
  • Belastungen: Was macht zu schaffen? (Burnout, Hypo-Angst, Frust über Werte, Stress, Schuldgefühle …)
  • Zusammenhänge: Beobachtbare Muster zwischen Stimmung, Blutzucker, Bewegung, Essen, Schlaf, Stress — als Beobachtung formulieren („du hast bemerkt …“, „es fällt auf, dass …“), nicht als medizinischer Rat.
  • Konkrete Ereignisse & Erkenntnisse aus dem Chat.
- VERBOTEN in der summary: dritte Person; jede Erwähnung von Gluco/Bot; Insulindosierung oder Therapieempfehlungen; Diagnosen; moralisierender Ton („gut/schlecht“, Schuldzuweisung); Fachjargon-Overkill.

Beispiele summary (Deutsch, nur das Feld summary — Stilrichtung):
SCHLECHT: „Der Nutzer entdeckt, dass regelmäßige Bewegung sowohl den Werten als auch der Stimmung guttut. Gluco bestärkt das als Ressource, ohne es zur Pflicht zu machen.“
GUT: „Du hast gemerkt, dass dir regelmäßige Bewegung — Spazieren, Radeln, Joggen — guttut: Nach dem Sport bist du entspannter, und dein Blutzucker bleibt nachmittags ruhiger. Bewegung scheint gerade eine Ressource für dich zu sein, die Werte und Stimmung zusammen trägt.“

SCHLECHT: „Der Nutzer zeigt Anzeichen von Burnout. Gluco erklärt mögliche Ursachen und empfiehlt einen Arzttermin.“
GUT: „Letzte Nacht war hart — erst eine Unterzuckerung, am Morgen trotzdem ein hoher Wert, und das lässt dich ratlos und erschöpft zurück. Du hast beschrieben, dass dir das ständige Managen gerade zu viel wird. Als Halt hast du deinen Hund erwähnt. Auffällig ist das Muster ‚hoher Morgenwert nach nächtlicher Hypo‘ — etwas, das du im Blick behalten könntest.“

TAGS:
- 3–6 items. Each tag: { "emoji": "<single real Unicode emoji>", "label": "<short theme in same language as summary>" }
- Use actual emoji characters (e.g. 😰), not placeholder words like "emoji_face".

moodEmoji:
- One primary mood Unicode emoji for the overall tone of what the user expressed.

EMOTIONS:
- Score each basic emotion from 0.0 to 1.0 (floats) based on the USER's messages only. Nuanced values, not all zeros.

The conversation transcript follows.`

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function normalizeTags(raw: unknown): ConversationTag[] {
  if (!Array.isArray(raw)) return []
  const out: ConversationTag[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ emoji: "·", label: s })
      continue
    }
    if (item && typeof item === "object" && "label" in item) {
      const emoji = String((item as { emoji?: unknown }).emoji ?? "·").trim() || "·"
      const label = String((item as { label?: unknown }).label ?? "").trim()
      if (label) out.push({ emoji, label })
    }
  }
  return out.slice(0, 6)
}

function normalizeEmotions(raw: unknown): ConversationEmotions {
  const base = {
    happiness: 0,
    surprise: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    disgust: 0,
  }
  if (!raw || typeof raw !== "object") return base
  const o = raw as Record<string, unknown>
  return {
    happiness: clamp01(typeof o.happiness === "number" ? o.happiness : Number(o.happiness)),
    surprise: clamp01(typeof o.surprise === "number" ? o.surprise : Number(o.surprise)),
    sadness: clamp01(typeof o.sadness === "number" ? o.sadness : Number(o.sadness)),
    anger: clamp01(typeof o.anger === "number" ? o.anger : Number(o.anger)),
    fear: clamp01(typeof o.fear === "number" ? o.fear : Number(o.fear)),
    disgust: clamp01(typeof o.disgust === "number" ? o.disgust : Number(o.disgust)),
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return new Response(JSON.stringify({ code: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const apiKeyMissing = !process.env.OPENAI_API_KEY || !openai
    if (apiKeyMissing) {
      return new Response(
        JSON.stringify({ code: "missing_api_key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = (await req.json()) as { messages: Message[] }
    const messages = body?.messages ?? []

    const conversationText = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n")

    const completion = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 550,
      temperature: 0.5,
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: conversationText || "(empty)" },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices?.[0]?.message?.content ?? "{}"
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content) as Record<string, unknown>
    } catch {
      return new Response(
        JSON.stringify({ code: "summarize_failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const title = typeof parsed.title === "string" ? parsed.title.trim() : ""
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : ""
    const tags = normalizeTags(parsed.tags)
    const moodEmoji =
      typeof parsed.moodEmoji === "string" && parsed.moodEmoji.trim()
        ? parsed.moodEmoji.trim()
        : "💬"
    const emotions = normalizeEmotions(parsed.emotions)

    const payload = {
      title: title || "untitled thread",
      summary: summary || "…",
      tags,
      moodEmoji,
      emotions,
    }

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return new Response(
      JSON.stringify({ code: "summarize_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
