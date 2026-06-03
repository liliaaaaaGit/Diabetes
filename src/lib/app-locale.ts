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

/** All short AI-generated copy (quotes, impulses, insights) must match the app UI language. */
export function aiOutputLanguageDirective(locale: Locale): string {
  if (locale === "en") {
    return `OUTPUT LANGUAGE: English. The user set the app interface to English. Write ALL generated text in English. Address the user as "you". Use normal English capitalization. Input context may be in German — still respond in English.`
  }
  return `AUSGABESPRACHE: Deutsch. Die App ist auf Deutsch. Schreibe ALLE generierten Texte auf Deutsch. Du-Ansprache (du, dein, dir). Korrekte Groß- und Kleinschreibung. Eingabedaten können gemischt sein — antworte trotzdem auf Deutsch.`
}

export function parseLocaleFromRequest(req: Request): Locale {
  try {
    const q = new URL(req.url).searchParams.get("locale")
    return resolveAppLocale(q)
  } catch {
    return "de"
  }
}

export const AI_FALLBACKS = {
  buddyQuote: {
    de: "Du bist nicht allein mit dem, was Diabetes emotional mit sich bringt. Ein kleiner, ehrlicher Schritt zählt — genau so, wie du heute unterwegs bist.",
    en: "You're not alone with what diabetes brings up emotionally. One small, honest step counts — just as you are today.",
  },
  buddyMotivation: {
    de: "Ein einzelner hoher oder niedriger Wert sagt nichts über dich als Person aus – er ist ein Signal, das du für deinen nächsten kleinen Schritt nutzen kannst.",
    en: "A single high or low reading doesn't define you — it's a signal you can use for your next small step.",
  },
  buddyImpulse: {
    de: "Gab es heute einen Moment, in dem dein Diabetes-Alltag anstrengend war? Wenn du magst, sortieren wir gemeinsam, was dir in solchen Situationen hilft.",
    en: "Was there a moment today when diabetes felt especially heavy? If you like, we can sort out what helps you in situations like that.",
  },
  buddyGoals: {
    de: [
      "Nenne heute einen kleinen Erfolg.",
      "Atme 3 Mal bewusst tief ein.",
      "Schreib auf, was dir gut tat.",
    ],
    en: [
      "Name one small win today.",
      "Take 3 conscious deep breaths.",
      "Write down what felt good today.",
    ],
  },
  moodGlucoseCorrelation: {
    de: "Sammle mehr Stimmungs- und Blutzuckerdaten, um Zusammenhänge zu erkennen.",
    en: "Add more mood and glucose data to spot patterns.",
  },
} as const
