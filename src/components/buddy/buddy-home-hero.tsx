"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

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
    <div className="flex min-h-0 flex-1 flex-col justify-center py-4 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:gap-10 lg:px-4">
        <div className="flex shrink-0 justify-center lg:w-[45%] lg:justify-end lg:pr-2">
          <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[min(100%,420px)]">
            <Image
              src="/buddy-robot.png"
              alt={robotImageAlt}
              width={840}
              height={840}
              priority
              className="h-auto w-full object-contain object-bottom"
            />
          </div>
        </div>

        <div className="relative min-h-[140px] flex-1 rounded-2xl bg-[#fffbeb] p-6 shadow-sm ring-1 ring-amber-100/90 md:p-8 lg:w-[55%] lg:min-h-[180px]">
          <span
            className="pointer-events-none absolute left-3 top-0 font-serif text-[4.5rem] leading-none text-amber-300/95 md:left-5 md:text-[5.5rem]"
            aria-hidden
          >
            &ldquo;
          </span>
          {quoteLoading ? (
            <div className="ml-2 mt-10 min-h-[100px] animate-pulse rounded-lg bg-amber-100/70 md:mt-12 md:min-h-[120px]" />
          ) : (
            <p className="relative z-10 ml-1 mt-10 text-base leading-relaxed text-slate-800 md:ml-2 md:mt-12 md:text-lg md:leading-relaxed">
              {quote}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col items-center px-4 md:mt-10">
        <Button
          type="button"
          onClick={onNewConversation}
          disabled={disabled}
          className="h-auto min-h-[3.25rem] w-full max-w-[400px] rounded-full bg-teal-500 px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-teal-600 md:text-lg"
        >
          <PlusCircle className="mr-2 h-6 w-6 shrink-0" strokeWidth={2} />
          {newChatLabel}
        </Button>
        <p className="mt-6 max-w-xl text-center text-sm leading-relaxed text-slate-500">{disclaimer}</p>
      </div>
    </div>
  )
}
