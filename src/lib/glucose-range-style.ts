/** mg/dL — UI bands from product spec (not identical to clinical TIR). */
export function glucoseValueTextClassMgDl(mgDl: number): string {
  if (!Number.isFinite(mgDl)) return "text-slate-900"
  if (mgDl < 70 || mgDl > 180) return "text-red-500"
  if (mgDl > 140) return "text-amber-500"
  return "text-green-600"
}
