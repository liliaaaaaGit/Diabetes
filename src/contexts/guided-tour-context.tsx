"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { TOUR_PHASE_COUNT } from "@/lib/guided-tour-phases"

export const TOUR_PHASE_STORAGE_KEY = "gc_tour_phase"

function readStoredPhase(): number {
  if (typeof window === "undefined") return 0
  const raw = sessionStorage.getItem(TOUR_PHASE_STORAGE_KEY)
  if (raw == null) return 0
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0 || n >= TOUR_PHASE_COUNT) return 0
  return n
}

export function clearTourPhaseStorage() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TOUR_PHASE_STORAGE_KEY)
  }
}

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
  const [tourPhase, setTourPhaseState] = useState(() => (active ? readStoredPhase() : 0))

  const setTourPhase = useCallback((phase: number) => {
    setTourPhaseState(phase)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOUR_PHASE_STORAGE_KEY, String(phase))
    }
  }, [])

  const startTour = useCallback(() => {
    clearTourPhaseStorage()
    setTourPhase(0)
  }, [setTourPhase])

  const endTour = useCallback(() => {
    clearTourPhaseStorage()
    setTourPhaseState(0)
  }, [])

  const value = useMemo(
    () => ({
      isActive: active,
      tourPhase,
      startTour,
      endTour,
      setTourPhase,
    }),
    [active, tourPhase, startTour, endTour, setTourPhase]
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
