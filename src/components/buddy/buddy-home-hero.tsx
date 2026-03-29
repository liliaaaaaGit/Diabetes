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
    <div className="flex min-h-0 flex-1 flex-col justify-start gap-3 py-1 md:gap-4 md:py-2">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-5 lg:px-2">
        <div className="flex shrink-0 justify-center lg:w-[46%] lg:justify-end lg:pr-1">
          <div className="flex h-[min(28vh,200px)] w-full max-w-[180px] items-end justify-center sm:h-[min(30vh,220px)] sm:max-w-[200px] md:h-[min(32vh,240px)] md:max-w-[220px] lg:h-[min(34vh,260px)] lg:max-w-[min(100%,280px)]">
            <Image
              src="/TherapistRobot4.png"
              alt={robotImageAlt}
              width={3691}
              height={3691}
              priority
              className="max-h-full w-auto max-w-full object-contain object-bottom"
            />
          </div>
        </div>

        <div className="relative flex min-h-[88px] flex-1 rounded-xl bg-teal-500/10 p-3 shadow-sm ring-1 ring-teal-500/15 sm:min-h-[96px] sm:p-4 lg:w-[54%]">
          <span
            className="pointer-events-none absolute left-2 top-0 font-serif text-5xl leading-none text-teal-500 sm:left-3 sm:text-6xl"
            aria-hidden
          >
            &ldquo;
          </span>
          {quoteLoading ? (
            <div className="ml-1 mt-7 min-h-[72px] flex-1 animate-pulse rounded-md bg-teal-500/15 sm:mt-8 sm:min-h-[80px]" />
          ) : (
            <p className="relative z-10 ml-0.5 mt-7 line-clamp-[7] text-sm leading-snug text-slate-800 sm:ml-1 sm:mt-8 sm:line-clamp-none sm:text-[0.9375rem] sm:leading-relaxed md:text-base">
              {quote}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-col items-center px-3 pt-0">
        <Button
          type="button"
          onClick={onNewConversation}
          disabled={disabled}
          className="h-auto min-h-[2.5rem] w-full max-w-[min(100%,360px)] rounded-full bg-teal-500 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-600 sm:min-h-[2.75rem] sm:text-base"
        >
          {newChatLabel}
        </Button>
        <p className="mt-2 max-w-lg text-center text-[11px] leading-snug text-slate-500 sm:mt-3 sm:text-xs sm:leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  )
}
