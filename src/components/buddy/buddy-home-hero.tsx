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
      <div className="flex min-h-0 w-full flex-[1.65] flex-col gap-3 min-[480px]:gap-4 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        <div className="flex min-h-[120px] flex-1 items-stretch justify-center lg:min-h-0 lg:basis-0 lg:max-w-[50%]">
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

        <div className="relative flex min-h-[100px] flex-1 flex-col lg:min-h-0 lg:basis-0 lg:max-w-[50%]">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto overscroll-contain rounded-xl bg-teal-500/10 p-4 shadow-sm ring-1 ring-teal-500/15 md:p-5 lg:p-6">
            <span
              className="pointer-events-none absolute left-3 top-1 font-serif text-5xl leading-none text-teal-500 md:left-4 md:top-2 md:text-6xl lg:text-7xl"
              aria-hidden
            >
              &ldquo;
            </span>
            {quoteLoading ? (
              <div className="mt-8 min-h-[4rem] shrink-0 animate-pulse rounded-md bg-teal-500/15 md:mt-10" />
            ) : (
              <p className="relative z-10 mt-8 shrink-0 text-base leading-relaxed text-slate-800 md:mt-10 md:text-lg lg:text-xl lg:leading-relaxed">
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
          className="h-auto w-full max-w-xl rounded-full bg-teal-500 px-10 py-4 text-lg font-semibold text-white shadow-md hover:bg-teal-600 md:px-12 md:py-5 md:text-xl"
        >
          {newChatLabel}
        </Button>
        <p className="max-w-xl text-center text-xs leading-snug text-slate-500 md:text-sm md:leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  )
}
