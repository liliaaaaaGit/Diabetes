"use client"

import { HeartHandshake } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

export function TypingIndicator() {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="mt-1 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <HeartHandshake className="h-4 w-4" />
          </div>
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2.5">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400">{t("buddy.typing")}</div>
    </div>
  )
}
