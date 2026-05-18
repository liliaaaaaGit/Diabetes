"use client"

import { AppShell } from "@/components/shared/app-shell"
import { QuestionnaireWizard } from "@/components/questionnaire/questionnaire-wizard"
import { useTranslation } from "@/hooks/useTranslation"

export default function StudyQuestionnairePage() {
  const { t } = useTranslation()

  return (
    <AppShell title={t("pages.questionnaire")} mainClassName="max-w-3xl">
      <QuestionnaireWizard />
    </AppShell>
  )
}
