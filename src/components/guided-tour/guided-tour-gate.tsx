"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { GuidedTourProvider } from "@/contexts/guided-tour-context"
import { GuidedTour } from "@/components/guided-tour/guided-tour"

const SKIP_PATH_PREFIXES = ["/login", "/register", "/consent", "/access", "/onboarding"]

interface GuidedTourGateProps {
  children: React.ReactNode
}

export function GuidedTourGate({ children }: GuidedTourGateProps) {
  const pathname = usePathname()
  const [tourActive, setTourActive] = useState(false)
  const [checked, setChecked] = useState(false)

  const skip = SKIP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (skip) {
      setChecked(true)
      setTourActive(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/user/onboarding", { credentials: "include" })
        if (!res.ok) return
        const data = (await res.json()) as { onboarding_completed?: boolean }
        if (!cancelled && !data.onboarding_completed) {
          setTourActive(true)
        }
      } finally {
        if (!cancelled) setChecked(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [skip, pathname])

  if (!checked) {
    return <>{children}</>
  }

  return (
    <GuidedTourProvider active={tourActive}>
      {children}
      {tourActive ? <GuidedTour onComplete={() => setTourActive(false)} /> : null}
    </GuidedTourProvider>
  )
}
