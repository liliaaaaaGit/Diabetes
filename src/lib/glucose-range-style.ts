/** Logbook glucose value color: green in target, red outside. */
export function glucoseValueTextClassMgDl(
  mgDl: number,
  targetMinMgDl: number,
  targetMaxMgDl: number
): string {
  if (!Number.isFinite(mgDl)) return "text-slate-900"
  if (mgDl < targetMinMgDl || mgDl > targetMaxMgDl) return "text-red-500"
  return "text-green-600"
}
