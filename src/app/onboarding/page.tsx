"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Onboarding } from "@/components/onboarding/onboarding"
import { useTranslation } from "@/hooks/useTranslation"

export default function OnboardingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/user/onboarding", { credentials: "include" })
        if (!res.ok) return
        const data = (await res.json()) as { onboarding_completed?: boolean }
        if (!cancelled && data.onboarding_completed) {
          await fetch("/api/user/onboarding", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ onboarding_completed: true }),
          })
          router.replace("/")
          router.refresh()
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </div>
    )
  }

  return <Onboarding />
}
