"use client"

import { EntryType } from "@/lib/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

interface FilterTabsProps {
  activeFilter: EntryType | "all"
  counts: Record<string, number>
  onChange: (filter: EntryType | "all") => void
}

export function FilterTabs({ activeFilter, counts, onChange }: FilterTabsProps) {
  const { t } = useTranslation()

  const filters: Array<{ value: EntryType | "all"; label: string }> = [
    { value: "all", label: t("logbook.all") },
    { value: "glucose", label: t("common.glucose") },
    { value: "insulin", label: t("common.insulin") },
    { value: "meal", label: t("common.meal") },
    { value: "activity", label: t("common.activity") },
    { value: "mood", label: t("common.mood") },
  ]

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
      <Tabs value={activeFilter} onValueChange={(v) => onChange(v as EntryType | "all")}>
        <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
          {filters.map((filter) => {
            const count = counts[filter.value] || 0
            return (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px]",
                  "data-[state=active]:bg-teal-500 data-[state=active]:text-white",
                  "data-[state=inactive]:bg-slate-100 data-[state=inactive]:text-slate-700"
                )}
              >
                {filter.label} {count > 0 && `(${count})`}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}
