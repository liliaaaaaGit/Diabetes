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
    <div className="flex min-h-0 w-full flex-col justify-between overflow-x-hidden overflow-y-auto">
      {/* Mobile layout */}
      <div className="md:hidden space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Image
            src="/TherapistRobot4-400.webp"
            alt={robotImageAlt}
            width={264}
            height={264}
            priority
            className="h-auto w-full max-w-[220px] object-contain object-left"
          />
          <Button
            type="button"
            onClick={onNewConversation}
            disabled={disabled}
            className="h-10 flex-shrink-0 rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-600"
          >
            {newChatLabel}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3">
          <p className="text-sm leading-snug text-slate-700">{disclaimer}</p>
        </div>

        <div className="relative rounded-xl bg-teal-500/10 p-4 shadow-sm ring-1 ring-teal-500/15">
          <span
            className="pointer-events-none absolute left-2 top-2 font-serif text-2xl leading-none text-teal-500"
            aria-hidden
          >
            &ldquo;
          </span>
          {quoteLoading ? (
            <div className="mt-6 min-h-[2.5rem] animate-pulse rounded-md bg-teal-500/15" />
          ) : (
            <p className="mt-6 text-sm leading-relaxed text-slate-800">{quote}</p>
          )}
        </div>
      </div>

      {/* Desktop/tablet layout */}
      <div className="hidden md:block">
        <div className="flex min-h-0 w-full flex-1 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-3 md:gap-4 lg:items-stretch lg:gap-6 xl:gap-8">
          <div className="flex min-h-[96px] w-full min-w-0 flex-col items-center justify-center sm:min-h-[110px] sm:w-1/3 lg:min-h-0 lg:w-auto lg:max-w-[min(100%,280px)] lg:shrink-0 lg:items-stretch">
            <div className="relative flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-visible">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcSet="/TherapistRobot4-400.webp"
                  type="image/webp"
                />
                <source srcSet="/TherapistRobot4.webp" type="image/webp" />
                <Image
                  src="/TherapistRobot4.webp"
                  alt={robotImageAlt}
                  width={800}
                  height={800}
                  priority
                  className="h-auto w-auto max-h-[120px] max-w-full object-contain object-center min-[480px]:max-h-[130px] md:max-h-[170px] lg:max-h-[min(260px,100%)]"
                />
              </picture>
            </div>
          </div>

          <div className="relative flex min-h-[120px] w-full min-w-0 flex-1 flex-col self-stretch sm:w-2/3 lg:w-auto">
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
    </div>
  )
}
