import { openai } from "@/lib/openai-server"
import { clampMoodValue } from "@/lib/mood"
import type { MoodValue } from "@/lib/types"

const MOOD_CLASSIFIER_PROMPT =
  "You are a mood classifier for a diabetes self-management app. The user describes how they feel in German. Respond with ONLY a single number from 1 to 5. Nothing else. No explanation. Scale: 1 = very bad (sehr schlecht, furchtbar, am Boden), 2 = bad (schlecht, frustriert, erschöpft, gestresst), 3 = neutral/okay (geht so, ganz okay, semi gut, normal), 4 = good (gut, zufrieden, ganz gut, positiv), 5 = very good (sehr gut, super, fantastisch, bester Tag). Consider the overall sentiment, not individual words. 'Müde aber zufrieden' = 3 or 4, not 2."

function parseMoodScore(raw: string): MoodValue {
  const firstNumber = raw.match(/\d+/)?.[0]
  if (!firstNumber) return 3
  return clampMoodValue(Number(firstNumber))
}

export async function scoreMoodText(text: string): Promise<MoodValue> {
  const trimmed = text.trim()
  if (!trimmed) return 3
  if (!openai) return 3

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 5,
      messages: [
        { role: "system", content: MOOD_CLASSIFIER_PROMPT },
        { role: "user", content: trimmed.slice(0, 500) },
      ],
    })

    const content = completion.choices?.[0]?.message?.content ?? ""
    return parseMoodScore(content)
  } catch (error) {
    console.error("[mood-score] Failed to score mood text:", error)
    return 3
  }
}

