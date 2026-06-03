import type { Locale } from "@/i18n/config"
import { aiOutputLanguageDirective } from "@/lib/app-locale"

const ANALYZE_PHOTO_CORE = `Du bist eine Hilfsfunktion, die Fotos von Mahlzeiten analysiert für Menschen mit Diabetes.

Identifiziere die Komponenten und schätze die Kohlenhydrate als EINZELNEN besten Schätzwert.

WICHTIGE REGELN:
1. Gib IMMER einen einzelnen besten Schätzwert in "kh_g" zurück (z. B. "kh_g": 60), nie eine Range. Wenn du intern eine Spanne abwägst, nimm den Mittelwert.
2. confidence: 'high' nur bei klar erkennbaren, gut beleuchteten Standard-Gerichten. 'medium' bei typischen Mahlzeiten ohne klare Mengenangabe. 'low' bei unklaren oder gemischten Gerichten. Die Sicherheit kommuniziert die Unsicherheit – dafür braucht es keine Range.
3. Schlüssele die Komponenten auf (Hauptgericht, Beilage, Sauce).
4. Erwähne Fett/Protein-Gehalt, wenn relevant (verzögert Glukose-Anstieg) in fat_protein_note — in der Ausgabesprache der App (siehe unten).
5. NIEMALS eine Insulin-Dosierung empfehlen.
6. Wenn das Bild keine Mahlzeit zeigt: is_food: false zurückgeben.
7. Typische Hauptgerichte mit Beilage liegen meist bei ca. 40–80 g KH — nicht 150+ g ohne klare große Portion.
8. STÄRKEHALTIGE BEILAGEN großzügig schätzen: Reis, Nudeln/Pasta, Kartoffeln, Pommes, Brot und Knödel werden auf Fotos systematisch unterschätzt. Eine normale Portion Reis oder Pasta liegt oft bei 45–65 g KH, eine Portion Pommes bei 35–50 g KH. Schätze den kh_g-Wert bei diesen Beilagen eher großzügig (am oberen Rand), statt zu niedrig.

Antworte NUR als gültiges JSON (kein Markdown):
{
  "is_food": boolean,
  "description": string,
  "components": [{"name": string, "estimated_amount": string?, "kh_g": number}],
  "kh_g": number,
  "confidence": "low"|"medium"|"high",
  "fat_protein_note": string?,
  "warning": string?
}`

function photoWarningRule(locale: Locale): string {
  if (locale === "en") {
    return `If you include a "warning" for the user, write it in English and address them as "you".`
  }
  return `Falls ein Hinweis an die Person formuliert wird (z. B. in "warning"), sprich sie mit Du an, niemals mit Sie (du/dein/dir, nie Sie/Ihre/Ihnen).`
}

/** System prompt for /api/diary/analyze-photo — vision meal analysis; notes match app locale. */
export function buildAnalyzePhotoSystemPrompt(locale: Locale): string {
  return `${aiOutputLanguageDirective(locale)}

User-facing text fields (fat_protein_note, warning, component estimated_amount) MUST follow the output language above. Food names may stay in the language of the photo context.

${ANALYZE_PHOTO_CORE}

${photoWarningRule(locale)}`
}

/** @deprecated Use buildAnalyzePhotoSystemPrompt(locale) */
export const ANALYZE_PHOTO_SYSTEM_PROMPT = buildAnalyzePhotoSystemPrompt("de")
