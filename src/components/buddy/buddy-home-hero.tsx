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
    <div className="flex h-full min-h-0 w-full flex-col justify-between overflow-x-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-row items-center gap-3 md:gap-4 lg:items-stretch lg:gap-6 xl:gap-8">
        <div className="flex min-h-[130px] w-2/5 min-w-0 flex-col items-center justify-center lg:min-h-0 lg:w-auto lg:max-w-[min(100%,420px)] lg:shrink-0 lg:items-stretch">
          <div className="relative flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-visible">
            <Image
              src="/TherapistRobot4.png"
              alt={robotImageAlt}
              width={3691}
              height={3691}
              priority
              className="h-auto w-auto max-h-[150px] max-w-full object-contain object-center min-[480px]:max-h-[170px] md:max-h-[220px] lg:max-h-[min(400px,100%)]"
            />
          </div>
        </div>

        <div className="relative flex min-h-[120px] w-3/5 min-w-0 flex-1 flex-col self-stretch lg:w-auto">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-hidden rounded-lg bg-teal-500/10 p-3 shadow-sm ring-1 ring-teal-500/15 md:px-4 md:py-4 lg:px-5 lg:py-5">
            <span
              className="pointer-events-none absolute left-1.5 top-2 font-serif text-2xl leading-none text-teal-500 md:left-2 md:top-3 md:text-4xl lg:text-4xl"
              aria-hidden
            >
              &ldquo;
            </span>
            {quoteLoading ? (
              <div className="mt-6 min-h-[2.5rem] shrink-0 animate-pulse rounded-md bg-teal-500/15 md:mt-9" />
            ) : (
              <p className="relative z-10 mt-6 shrink-0 text-sm leading-relaxed text-slate-800 md:mt-9 md:text-base">
                {quote}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unten: Abstand nach oben, Button bleibt schmal; Disclaimer breit */}
      <div className="mt-10 flex w-full shrink-0 flex-col items-center gap-3 pb-1 md:mt-12 md:gap-4 md:pb-2">
        <Button
          type="button"
          onClick={onNewConversation}
          disabled={disabled}
          className="h-auto w-full rounded-full bg-teal-500 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-teal-600 md:max-w-sm"
        >
          {newChatLabel}
        </Button>
        <p className="w-full max-w-3xl text-center text-sm leading-snug text-slate-500 md:max-w-4xl md:text-base md:leading-snug">
          {disclaimer}
        </p>
      </div>
    </div>
  )
}
