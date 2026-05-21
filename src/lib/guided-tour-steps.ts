export type GuidedTourPlacement = "top" | "bottom" | "left" | "right" | "center"

export type GuidedTourStep = {
  id: string
  /** CSS selector; omit for centered welcome step */
  target?: string
  titleKey: string
  descriptionKey: string
  primaryKey?: string
  placement?: GuidedTourPlacement
  /** On mobile, open the hamburger menu before highlighting nav targets */
  openMobileNav?: boolean
}

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  {
    id: "welcome",
    titleKey: "onboarding.welcomeTitle",
    descriptionKey: "onboarding.welcomeBody",
    primaryKey: "onboarding.startTour",
    placement: "center",
  },
  {
    id: "logbook",
    target: '[data-tour="nav-logbook"]',
    titleKey: "onboarding.logbookTitle",
    descriptionKey: "onboarding.logbookBody",
    placement: "right",
    openMobileNav: true,
  },
  {
    id: "buddy",
    target: '[data-tour="nav-buddy"]',
    titleKey: "onboarding.buddyTitle",
    descriptionKey: "onboarding.buddyBody",
    placement: "right",
    openMobileNav: true,
  },
  {
    id: "insights",
    target: '[data-tour="nav-insights"]',
    titleKey: "onboarding.insightsTitle",
    descriptionKey: "onboarding.insightsBody",
    placement: "right",
    openMobileNav: true,
  },
  {
    id: "add-entry",
    target: '[data-tour="add-entry"]',
    titleKey: "onboarding.addEntryTitle",
    descriptionKey: "onboarding.addEntryBody",
    primaryKey: "onboarding.discoverApp",
    placement: "top",
    openMobileNav: false,
  },
]

export const GUIDED_TOUR_SPOTLIGHT_PADDING = 8
