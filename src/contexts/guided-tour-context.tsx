"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type GuidedTourContextValue = {
  isActive: boolean
  tourPhase: number
  startTour: () => void
  endTour: () => void
  setTourPhase: (phase: number) => void
}

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null)

export function GuidedTourProvider({
  children,
  active = false,
}: {
  children: ReactNode
  /** Controlled from gate: true while onboarding tour should run */
  active?: boolean
}) {
  const [tourPhase, setTourPhase] = useState(0)

  useEffect(() => {
    if (active) setTourPhase(0)
  }, [active])

  const startTour = useCallback(() => {
    setTourPhase(0)
  }, [])

  const endTour = useCallback(() => {
    setTourPhase(0)
  }, [])

  const value = useMemo(
    () => ({
      isActive: active,
      tourPhase,
      startTour,
      endTour,
      setTourPhase,
    }),
    [active, tourPhase, startTour, endTour]
  )

  return <GuidedTourContext.Provider value={value}>{children}</GuidedTourContext.Provider>
}

export function useGuidedTour() {
  const ctx = useContext(GuidedTourContext)
  if (!ctx) {
    throw new Error("useGuidedTour must be used within GuidedTourProvider")
  }
  return ctx
}

export function useGuidedTourOptional() {
  return useContext(GuidedTourContext)
}
