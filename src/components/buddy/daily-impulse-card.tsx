"use client"

import { MessageCircleHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"

interface DailyImpulseCardProps {
  impulseText: string
  greeting: string
  onStartChat: () => void
}

export function DailyImpulseCard({ impulseText, greeting, onStartChat }: DailyImpulseCardProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 p-6 text-white shadow-sm">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold text-teal-50">{greeting}</p>
        <p className="mt-3 text-base leading-relaxed md:text-lg">{impulseText}</p>
        <Button
          type="button"
          onClick={onStartChat}
          className="mt-5 rounded-full bg-white text-teal-700 hover:bg-teal-50"
        >
          <MessageCircleHeart className="mr-2 h-4 w-4" />
          {t("buddy.letsChat")}
        </Button>
      </div>
    </div>
  )
}
