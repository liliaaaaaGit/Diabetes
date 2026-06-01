/**
 * Color for a glucose value, tuned to be informative rather than alarming.
 *
 * Design goal (expert patient review): a mildly elevated value like 197 mg/dL
 * should NOT be shown in bright red, because that triggers "diabetes guilt".
 * Bright red is reserved for the safety-critical low range.
 *
 * Scale (mg/dL):
 *   < 54            → red      (urgent hypo — safety-critical)
 *   54 .. targetMin → orange   (hypo — needs attention)
 *   in target range → teal     (in range, app accent)
 *   target .. 250   → amber    (above range, calm signal)
 *   > 250           → dark amber (significantly high, firmer but not alarming)
 */
export function glucoseValueTextClassMgDl(
  mgDl: number,
  targetMinMgDl: number,
  targetMaxMgDl: number
): string {
  if (!Number.isFinite(mgDl)) return "text-slate-900"
  // Safety-critical low keeps a strong color.
  if (mgDl < 54) return "text-red-600"
  // Mild hypo (below the user's target but not an emergency).
  if (mgDl < targetMinMgDl) return "text-orange-600"
  // In target range.
  if (mgDl <= targetMaxMgDl) return "text-teal-600"
  // Significantly high gets a firmer (but still warm) amber.
  if (mgDl > 250) return "text-amber-700"
  // Above range — calm, informative amber (e.g. 197 mg/dL).
  return "text-amber-600"
}
