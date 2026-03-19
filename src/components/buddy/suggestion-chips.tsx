"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface SuggestionChipsProps {
  onSelect: (text: string) => void
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const { t } = useTranslation()

  const suggestions = [
    t("buddy.suggestion1"),
    t("buddy.suggestion2"),
    t("buddy.suggestion3"),
    t("buddy.suggestion4"),
  ]

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2">
      <div className="flex gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "rounded-full whitespace-nowrap text-sm min-h-[44px]",
              "border-slate-300 text-slate-700 hover:bg-slate-50",
              index === 0 && "border-emerald-300 text-emerald-700 bg-emerald-50/40",
              index === 1 && "border-amber-300 text-amber-700 bg-amber-50/40",
              index === 2 && "border-rose-300 text-rose-700 bg-rose-50/40",
              index === 3 && "border-sky-300 text-sky-700 bg-sky-50/40"
            )}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
