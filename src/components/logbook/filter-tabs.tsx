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
    { value: "glucose", label: t("logbook.glucose") },
    { value: "insulin", label: t("logbook.insulin") },
    { value: "meal", label: t("logbook.meal") },
    { value: "activity", label: t("logbook.activity") },
    { value: "mood", label: t("logbook.mood") },
  ]

  return (
    <div className="overflow-hidden">
      <Tabs value={activeFilter} onValueChange={(v) => onChange(v as EntryType | "all")}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {filters.map((filter) => {
            const count = counts[filter.value] || 0
            return (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className={cn(
                  "min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-medium sm:text-sm",
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
