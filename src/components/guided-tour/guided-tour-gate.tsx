"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { GuidedTour } from "@/components/guided-tour/guided-tour"

const SKIP_PATH_PREFIXES = ["/login", "/register", "/consent", "/access", "/onboarding"]

interface GuidedTourGateProps {
  children: React.ReactNode
  onOpenMobileNav?: () => void
  onCloseMobileNav?: () => void
}

export function GuidedTourGate({ children, onOpenMobileNav, onCloseMobileNav }: GuidedTourGateProps) {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [checked, setChecked] = useState(false)

  const skip = SKIP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (skip) {
      setChecked(true)
      setActive(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/user/onboarding", { credentials: "include" })
        if (!res.ok) return
        const data = (await res.json()) as { onboarding_completed?: boolean }
        if (!cancelled && !data.onboarding_completed) {
          setActive(true)
        }
      } finally {
        if (!cancelled) setChecked(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [skip, pathname])

  return (
    <>
      {children}
      {checked && active ? (
        <GuidedTour
          onComplete={() => setActive(false)}
          onOpenMobileNav={onOpenMobileNav}
          onCloseMobileNav={onCloseMobileNav}
        />
      ) : null}
    </>
  )
}
