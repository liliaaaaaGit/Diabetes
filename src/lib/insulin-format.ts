import type { Locale } from "@/i18n/config"

/** Round insulin dose to one decimal (avoids float display bugs). */
export function roundInsulinDose(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 10) / 10
}

/**
 * Format insulin units for display: always one decimal place.
 * DE: comma decimal separator (37,8). EN: dot (37.8).
 */
export function formatInsulin(value: number, locale: Locale = "de"): string {
  const rounded = roundInsulinDose(value)
  const text = rounded.toFixed(1)
  return locale === "de" ? text.replace(".", ",") : text
}
