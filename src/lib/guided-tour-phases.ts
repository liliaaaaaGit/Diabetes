import type { LucideIcon } from "lucide-react"
import {
  ChartSpline,
  Calendar,
  Camera,
  Edit3,
  Goal,
  History,
  Link2,
  LineChart,
  MessageCircle,
  Sparkles,
  Smile,
  TrendingUp,
} from "lucide-react"

/** App routes per tour phase (dashboard = /). */
export const TOUR_PHASE_ROUTES = ["/", "/", "/logbook", "/buddy", "/insights", "/"] as const

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
    primaryKey: "onboarding.startTour",
  },
  {
    id: "glucose",
    titleKey: "onboarding.glucoseTitle",
    bodyKey: "onboarding.glucoseIntro",
    features: [
      { icon: ChartSpline, textKey: "onboarding.glucoseFeature1" },
      { icon: Goal, textKey: "onboarding.glucoseFeature2" },
      { icon: TrendingUp, textKey: "onboarding.glucoseFeature3" },
    ],
    primaryKey: "onboarding.ctaToLogbook",
  },
  {
    id: "logbook",
    titleKey: "onboarding.logbookTitle",
    bodyKey: "onboarding.logbookIntro",
    features: [
      { icon: Camera, textKey: "onboarding.logbookFeature1" },
      { icon: Sparkles, textKey: "onboarding.logbookFeature2" },
      { icon: Edit3, textKey: "onboarding.logbookFeature3" },
      { icon: Calendar, textKey: "onboarding.logbookFeature4" },
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
      { icon: Sparkles, textKey: "onboarding.insightsFeature4" },
    ],
    primaryKey: "onboarding.ctaFinishTour",
  },
  {
    id: "done",
    titleKey: "onboarding.doneTitle",
    bodyKey: "onboarding.doneBody",
    primaryKey: "onboarding.discoverApp",
    completeOnboardingOnPrimary: true,
  },
]

export function routeMatchesPhase(pathname: string, phase: number): boolean {
  const expected = TOUR_PHASE_ROUTES[phase]
  if (!expected) return false
  return pathname === expected
}
