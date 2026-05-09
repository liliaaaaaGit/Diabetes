"use client"

import { useTranslation } from "@/hooks/useTranslation"

export function ThesisInfoContent() {
  const { t } = useTranslation()

  return (
    <article className="space-y-6 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {t("thesisInfoPage.title")}
        </h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">{t("thesisInfoPage.sectionResearchTitle")}</h2>
        <p>{t("thesisInfoPage.sectionResearchBody")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">{t("thesisInfoPage.sectionEvalTitle")}</h2>
        <p>{t("thesisInfoPage.sectionEvalBody")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">{t("thesisInfoPage.sectionDataTitle")}</h2>
        <p>{t("thesisInfoPage.sectionDataBody")}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">{t("thesisInfoPage.sectionWhoTitle")}</h2>
        <div className="space-y-1 text-slate-700">
          <p className="font-medium text-slate-900">{t("thesisInfoPage.whoName")}</p>
          <p>{t("thesisInfoPage.whoLine1")}</p>
          <p>{t("thesisInfoPage.whoLine2")}</p>
          <p>{t("thesisInfoPage.whoLine3")}</p>
          <p>{t("thesisInfoPage.whoLine4")}</p>
          <p className="pt-2">{t("thesisInfoPage.whoContact")}</p>
          <p className="pt-2 text-slate-700">{t("thesisInfoPage.whoClosing")}</p>
        </div>
      </section>
    </article>
  )
}
