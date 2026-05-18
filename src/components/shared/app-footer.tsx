"use client"

import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"

export function AppFooter() {
  const { t, locale } = useTranslation()

  const impressumHref = locale === "en" ? "/imprint" : "/impressum"
  const privacyHref = locale === "en" ? "/privacy" : "/datenschutz"

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 py-1.5 backdrop-blur md:left-[280px] md:py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2 text-center text-[10px] leading-snug text-slate-500 md:gap-x-2 md:gap-y-1 md:px-3 md:text-xs">
        <span>{t("safety.notice")}</span>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link
          href={impressumHref}
          className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          {t("legal.impressumLink")}
        </Link>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link
          href={privacyHref}
          className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          {t("legal.privacyLink")}
        </Link>
      </div>
    </footer>
  )
}
