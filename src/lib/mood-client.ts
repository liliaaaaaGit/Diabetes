import type { MoodValue } from "@/lib/types"
import { clampMoodValue } from "@/lib/mood"

export async function scoreMoodTextClient(text: string): Promise<MoodValue> {
  const trimmed = text.trim()
  if (!trimmed) return 3

  try {
    const res = await fetch("/api/mood-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: trimmed }),
    })

    if (!res.ok) return 3
    const json = (await res.json()) as { moodValue?: number }
    return clampMoodValue(Number(json.moodValue))
  } catch {
    return 3
  }
}

