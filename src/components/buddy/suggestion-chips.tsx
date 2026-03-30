"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface SuggestionChipsProps {
  onSelect: (text: string) => void
  suggestions?: string[]
}

function chipToneClass(suggestion: string): string {
  const s = suggestion.toLowerCase()
  if (/(angst|sorge|ueberfordert|überfordert|frust|traurig|stress|burnout|schuld)/.test(s)) {
    return "border-rose-300 text-rose-700 bg-rose-50/40"
  }
  if (/(gut|stolz|dankbar|erfolg|gelungen|leichter|ruhig|geschafft)/.test(s)) {
    return "border-teal-300 text-teal-700 bg-teal-50/40"
  }
  return "border-slate-300 text-slate-700 hover:bg-slate-50"
}

export function SuggestionChips({ onSelect, suggestions }: SuggestionChipsProps) {
  const { t } = useTranslation()

  const defaultSuggestions = [
    t("buddy.suggestion1"),
    t("buddy.suggestion2"),
    t("buddy.suggestion3"),
    t("buddy.suggestion4"),
  ]
  const chips = (suggestions && suggestions.length > 0 ? suggestions : defaultSuggestions).slice(0, 3)

  return (
    <div className="overflow-hidden pb-2">
      <div className="flex flex-wrap gap-2">
        {chips.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "min-h-[40px] rounded-full px-3 text-xs sm:text-sm",
              chipToneClass(suggestion)
            )}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
