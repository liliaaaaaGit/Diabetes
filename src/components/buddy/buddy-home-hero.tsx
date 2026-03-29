"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface BuddyHomeHeroProps {
  quote: string
  quoteLoading: boolean
  newChatLabel: string
  disclaimer: string
  robotImageAlt: string
  onNewConversation: () => void
  disabled?: boolean
}

export function BuddyHomeHero({
  quote,
  quoteLoading,
  newChatLabel,
  disclaimer,
  robotImageAlt,
  onNewConversation,
  disabled = false,
}: BuddyHomeHeroProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-between gap-3 md:gap-4">
      {/* Oberer Bereich ~60–65 %: Roboter + Zitat */}
      <div className="flex min-h-0 w-full flex-[1.65] flex-col gap-3 min-[480px]:gap-4 lg:flex-row lg:items-stretch lg:gap-5 xl:gap-6">
        {/* Roboter: etwas über die Hälfte der oberen Zeile (~58 %), Bild skaliert groß */}
        <div className="flex min-h-[120px] flex-1 items-stretch justify-center lg:min-h-0 lg:flex-[1.35] lg:basis-0">
          <div className="relative flex h-full min-h-0 w-full items-end justify-center">
            <Image
              src="/TherapistRobot4.png"
              alt={robotImageAlt}
              width={3691}
              height={3691}
              priority
              className="h-full max-h-full w-full max-w-full object-contain object-bottom"
            />
          </div>
        </div>

        <div className="relative flex min-h-[100px] flex-1 flex-col lg:min-h-0 lg:flex-[0.85] lg:basis-0">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto overscroll-contain rounded-lg bg-teal-500/10 p-3 shadow-sm ring-1 ring-teal-500/15 md:p-3.5 lg:p-4">
            <span
              className="pointer-events-none absolute left-2 top-0.5 font-serif text-4xl leading-none text-teal-500 md:left-3 md:top-1 md:text-5xl lg:text-5xl"
              aria-hidden
            >
              &ldquo;
            </span>
            {quoteLoading ? (
              <div className="mt-6 min-h-[3rem] shrink-0 animate-pulse rounded-md bg-teal-500/15 md:mt-7" />
            ) : (
              <p className="relative z-10 mt-6 shrink-0 text-base leading-snug text-slate-800 md:mt-7 md:leading-relaxed">
                {quote}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unterer Bereich ~35–40 %: Button + Disclaimer */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 px-2 pb-1 md:gap-4 md:pb-0">
        <Button
          type="button"
          onClick={onNewConversation}
          disabled={disabled}
          className="h-auto w-full max-w-sm rounded-full bg-teal-500 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-teal-600"
        >
          {newChatLabel}
        </Button>
        <p className="max-w-sm text-center text-xs leading-snug text-slate-500 md:text-sm md:leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  )
}
