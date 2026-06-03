import type { Locale } from "@/i18n/config"

/** Normalize client locale for server-side AI prompts. */
export function resolveAppLocale(locale?: string | null): Locale {
  return locale === "en" ? "en" : "de"
}

export function buddyLanguageDirective(locale: Locale): string {
  if (locale === "en") {
    return `ACTIVE APP LANGUAGE: English. The user set the app interface to English. Reply in English for this conversation unless they clearly write in German throughout.`
  }
  return `AKTIVE APP-SPRACHE: Deutsch. Die Nutzer:in hat die App auf Deutsch gestellt. Antworte auf Deutsch, außer die Nutzer:in schreibt durchgängig auf Englisch.`
}

export function summarizeLanguageDirective(locale: Locale): string {
  if (locale === "en") {
    return `APP LANGUAGE: English. The user uses the app in English. Write title, summary, and tag labels in English (match the user's chat language when they wrote mostly German).`
  }
  return `APP-SPRACHE: Deutsch. Die App ist auf Deutsch. Schreibe Titel, Zusammenfassung und Tag-Labels auf Deutsch (es sei denn, der Chat war eindeutig überwiegend Englisch — dann Englisch).`
}
