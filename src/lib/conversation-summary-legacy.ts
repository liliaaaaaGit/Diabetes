import type { Conversation } from "@/lib/types"

/**
 * True when the row predates the empathetic summary + emotions pipeline
 * (no `emotions` jsonb saved) or the text still matches the old clinical / third-person style.
 */
export function conversationSummaryLooksLegacy(c: Conversation): boolean {
  const s = c.summary?.trim()
  if (!s) return false

  const thirdPersonDe =
    /sprach über|teilte gefühle|teilte |der nutzer|die nutzerin|nutzer sprach|patient sprach|der\/die nutzer/i.test(
      s
    )
  const thirdPersonEn = /\bthe user\b|\bthey shared\b|\buser shared\b|^they |^he |^she /i.test(s)
  const mentionsGluco = /\bgluco\b/i.test(s)

  if (thirdPersonDe || thirdPersonEn || mentionsGluco) return true

  if (c.emotions != null) {
    // Has emotions but text still matches old third-person / Gluco style → allow refresh.
    return false
  }

  const sentenceChunks = s.split(/(?<=[.!?])\s+/).filter((p) => p.trim().length > 0)
  if (sentenceChunks.length <= 2 && s.length < 400) return true

  // No emotions on row + moderate length → offer refresh so users can upgrade in place.
  return s.length < 420
}
