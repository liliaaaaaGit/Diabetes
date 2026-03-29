/** Delimiters the model uses for the crisis safety section (parsed client-side for styling). */
export const BUDDY_SAFETY_OPEN = "<!--buddy_safety-->"
export const BUDDY_SAFETY_CLOSE = "<!--/buddy_safety-->"

export function splitBuddySafetyContent(raw: string): { safety: string | null; rest: string } {
  const i = raw.indexOf(BUDDY_SAFETY_OPEN)
  const j = raw.indexOf(BUDDY_SAFETY_CLOSE)
  if (i === -1 || j === -1 || j <= i) return { safety: null, rest: raw }
  const safety = raw.slice(i + BUDDY_SAFETY_OPEN.length, j).trim()
  const rest = (raw.slice(0, i) + raw.slice(j + BUDDY_SAFETY_CLOSE.length)).trim()
  return { safety, rest }
}

export function stripChipMarkers(content: string): string {
  return content.replace(/<!--chips:\s*\[[\s\S]*?\]\s*-->/g, "").trim()
}
