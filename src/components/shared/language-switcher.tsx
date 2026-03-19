"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex gap-1">
      <Button
        variant={locale === "de" ? "default" : "outline"}
        size="sm"
        className="flex-1 h-8 text-xs"
        onClick={() => setLocale("de")}
      >
        DE
      </Button>
      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        className="flex-1 h-8 text-xs"
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  )
}
