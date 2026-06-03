import type { Locale } from "@/i18n/config"
import { resolveAppLocale } from "@/lib/app-locale"

/** Locale from `?locale=` (GET) or JSON body `{ locale }` (POST). Defaults to German. */
export async function parseRequestLocale(req: Request): Promise<Locale> {
  try {
    const fromQuery = new URL(req.url).searchParams.get("locale")
    if (fromQuery) return resolveAppLocale(fromQuery)
  } catch {
    // ignore
  }

  if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
    try {
      const clone = req.clone()
      const body = (await clone.json()) as { locale?: string }
      if (body?.locale) return resolveAppLocale(body.locale)
    } catch {
      // no JSON body
    }
  }

  return "de"
}
