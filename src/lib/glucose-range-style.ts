/** mg/dL — Logbook ampel: grün 70–140, orange 141–180, rot sonst. */
export function glucoseValueTextClassMgDl(mgDl: number): string {
  if (!Number.isFinite(mgDl)) return "text-slate-900"
  if (mgDl < 70 || mgDl > 180) return "text-red-500"
  if (mgDl > 140) return "text-amber-500"
  return "text-green-600"
}
