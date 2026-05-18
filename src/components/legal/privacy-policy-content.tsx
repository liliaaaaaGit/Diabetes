"use client"

import { useTranslation } from "@/hooks/useTranslation"
import { DatenschutzPolicyContent } from "@/components/legal/datenschutz-policy-content"
import { PrivacyPolicyContentEn } from "@/components/legal/privacy-policy-content-en"

/** Locale-aware privacy policy (DE: /datenschutz text, EN: translated equivalent). */
export function PrivacyPolicyContent() {
  const { locale } = useTranslation()
  if (locale === "en") {
    return <PrivacyPolicyContentEn />
  }
  return <DatenschutzPolicyContent />
}
