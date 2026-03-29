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
    <div className="flex h-full min-h-0 w-full flex-col justify-between">
      {/* flex-1 füllt die Höhe bis zum Button – Leerraum sitzt unter Roboter/Zitat, nicht als „Kloß“ in der Mitte */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 min-[480px]:gap-4 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        {/* Roboter: links dominant, Desktop ca. 350–400px Bildhöhe */}
        <div className="flex min-h-[160px] min-w-0 flex-col items-center justify-end lg:min-h-0 lg:flex-[1.55] lg:basis-0 lg:items-stretch">
          <div className="relative flex w-full flex-1 items-end justify-center lg:min-h-0">
            <Image
              src="/TherapistRobot4.png"
              alt={robotImageAlt}
              width={3691}
              height={3691}
              priority
              className="h-auto w-auto max-w-full object-contain object-bottom max-h-[min(52vh,340px)] min-[480px]:max-h-[min(50vh,380px)] lg:h-[380px] lg:max-h-[400px] lg:min-h-[350px]"
            />
          </div>
        </div>

        {/* Zitat: schmal, volle Zeilenhöhe neben Roboter */}
        <div className="relative flex min-h-[120px] min-w-0 flex-1 flex-col self-stretch lg:max-w-[280px] lg:flex-[0.52] lg:basis-0 xl:max-w-[300px]">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto overscroll-contain rounded-lg bg-teal-500/10 px-2.5 py-5 shadow-sm ring-1 ring-teal-500/15 sm:px-3 sm:py-6 md:py-7 lg:px-3 lg:py-8">
            <span
              className="pointer-events-none absolute left-1.5 top-2 font-serif text-3xl leading-none text-teal-500 sm:left-2 sm:top-3 sm:text-4xl lg:text-4xl"
              aria-hidden
            >
              &ldquo;
            </span>
            {quoteLoading ? (
              <div className="mt-8 min-h-[3rem] shrink-0 animate-pulse rounded-md bg-teal-500/15 sm:mt-9" />
            ) : (
              <p className="relative z-10 mt-8 shrink-0 text-pretty text-base leading-relaxed text-slate-800 sm:mt-9">
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
          className="h-auto w-full max-w-sm rounded-full bg-teal-500 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-teal-600"
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
