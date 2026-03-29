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
        {/* Roboter: zentriert in der Zelle, max-h relativ zum Container → kein Abschneiden oben (kein items-end + overflow-hidden) */}
        <div className="flex min-h-[160px] min-w-0 flex-col items-center justify-center lg:min-h-0 lg:flex-[1.45] lg:basis-0 lg:items-stretch">
          <div className="relative flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-visible">
            <Image
              src="/TherapistRobot4.png"
              alt={robotImageAlt}
              width={3691}
              height={3691}
              priority
              className="h-auto w-auto max-w-full object-contain object-center max-h-[min(52vh,340px)] min-[480px]:max-h-[min(50vh,380px)] lg:max-h-[min(400px,100%)]"
            />
          </div>
        </div>

        {/* Zitat: breiter (mehr Zeilenbreite, weniger Zeilen), nicht extra hoch durch Padding */}
        <div className="relative flex min-h-[120px] min-w-0 flex-1 flex-col self-stretch lg:max-w-xl lg:flex-[1] lg:basis-0 xl:max-w-2xl">
          <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto overscroll-contain rounded-lg bg-teal-500/10 px-3 py-4 shadow-sm ring-1 ring-teal-500/15 sm:px-4 sm:py-4 md:py-5 lg:px-5 lg:py-5">
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
