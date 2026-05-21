import type { LucideIcon } from "lucide-react"
import {
  Calendar,
  Camera,
  Droplet,
  History,
  LineChart,
  Link2,
  MessageCircle,
  Smile,
  TrendingUp,
} from "lucide-react"

/** App routes per tour phase (dashboard = /). */
export const TOUR_PHASE_ROUTES = ["/", "/logbook", "/buddy", "/insights", "/"] as const

export const TOUR_PHASE_COUNT = TOUR_PHASE_ROUTES.length

export type TourFeatureItem = {
  icon: LucideIcon
  textKey: string
}

export type TourPhaseContent = {
  id: string
  titleKey: string
  bodyKey: string
  hintKey?: string
  features?: TourFeatureItem[]
  primaryKey: string
  /** Phase 3 completes onboarding in DB before moving to phase 4 */
  completeOnboardingOnPrimary?: boolean
}

export const TOUR_PHASES: TourPhaseContent[] = [
  {
    id: "welcome",
    titleKey: "onboarding.welcomeTitle",
    bodyKey: "onboarding.welcomeBody",
    hintKey: "onboarding.welcomeHint",
    primaryKey: "onboarding.startTour",
  },
  {
    id: "logbook",
    titleKey: "onboarding.logbookTitle",
    bodyKey: "onboarding.logbookIntro",
    features: [
      { icon: Droplet, textKey: "onboarding.logbookFeature1" },
      { icon: Camera, textKey: "onboarding.logbookFeature2" },
      { icon: Calendar, textKey: "onboarding.logbookFeature3" },
    ],
    primaryKey: "onboarding.ctaToBuddy",
  },
  {
    id: "buddy",
    titleKey: "onboarding.buddyTitle",
    bodyKey: "onboarding.buddyIntro",
    features: [
      { icon: MessageCircle, textKey: "onboarding.buddyFeature1" },
      { icon: History, textKey: "onboarding.buddyFeature2" },
      { icon: LineChart, textKey: "onboarding.buddyFeature3" },
    ],
    primaryKey: "onboarding.ctaToInsights",
  },
  {
    id: "insights",
    titleKey: "onboarding.insightsTitle",
    bodyKey: "onboarding.insightsIntro",
    features: [
      { icon: TrendingUp, textKey: "onboarding.insightsFeature1" },
      { icon: Smile, textKey: "onboarding.insightsFeature2" },
      { icon: Link2, textKey: "onboarding.insightsFeature3" },
    ],
    primaryKey: "onboarding.ctaFinishTour",
    completeOnboardingOnPrimary: true,
  },
  {
    id: "done",
    titleKey: "onboarding.doneTitle",
    bodyKey: "onboarding.doneBody",
    primaryKey: "onboarding.discoverApp",
  },
]

export function routeMatchesPhase(pathname: string, phase: number): boolean {
  const expected = TOUR_PHASE_ROUTES[phase]
  if (!expected) return false
  return pathname === expected
}
