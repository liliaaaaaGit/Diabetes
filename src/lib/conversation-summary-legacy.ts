import type { Conversation } from "@/lib/types"

/**
 * True when the row predates the empathetic summary + emotions pipeline
 * (no `emotions` jsonb saved) or the text still matches the old clinical / third-person style.
 */
export function conversationSummaryLooksLegacy(c: Conversation): boolean {
  const s = c.summary?.trim()
  if (!s) return false

  if (c.emotions != null) {
    // Rows saved after the new summarize API include emotion scores; treat as current.
    return false
  }

  // Long, lowercase "du/you" style paragraphs from the new prompt are unlikely to match old templates.
  if (s.length >= 500) return false

  const thirdPersonDe =
    /sprach über|teilte gefühle|teilte |der nutzer|die nutzerin|nutzer sprach|patient sprach/i.test(s)
  const thirdPersonEn = /^they |^the user |^he |^she |^user shared/i.test(s)

  if (thirdPersonDe || thirdPersonEn) return true

  const sentenceChunks = s.split(/(?<=[.!?])\s+/).filter((p) => p.trim().length > 0)
  if (sentenceChunks.length <= 2 && s.length < 400) return true

  // No emotions on row + moderate length → offer refresh so users can upgrade in place.
  return s.length < 420
}
