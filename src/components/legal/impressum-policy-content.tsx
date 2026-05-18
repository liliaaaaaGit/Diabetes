"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { ImpressumContent } from "@/components/legal/impressum-content"
import { ImprintContentEn } from "@/components/legal/imprint-content-en"

/** Locale-aware legal notice (DE: /impressum, EN: /imprint equivalent). */
export function ImpressumPolicyContent() {
  const { locale } = useTranslation()
  if (locale === "en") {
    return <ImprintContentEn />
  }
  return <ImpressumContent />
}
