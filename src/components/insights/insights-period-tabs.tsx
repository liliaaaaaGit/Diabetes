"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"
import type { InsightsTimeRangeKey } from "@/lib/insights-aggregate"

type InsightsPeriodTabsProps = {
  value: InsightsTimeRangeKey
  onValueChange: (v: InsightsTimeRangeKey) => void
  className?: string
  /** Compact styling for use inside section cards (e.g. mood & glucose). */
  size?: "default" | "compact"
}

export function InsightsPeriodTabs({
  value,
  onValueChange,
  className,
  size = "default",
}: InsightsPeriodTabsProps) {
  const { t } = useTranslation()
  const triggerCn =
    size === "compact"
      ? "rounded-md px-2.5 py-1.5 text-xs data-[state=active]:bg-teal-500 data-[state=active]:text-white"
      : "rounded-lg px-4 py-2 text-sm data-[state=active]:bg-teal-500 data-[state=active]:text-white"

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as InsightsTimeRangeKey)}
      className={cn("w-full sm:w-auto", className)}
    >
      <TabsList
        className={cn(
          "grid w-full grid-cols-3 bg-slate-100/80 p-1 h-auto sm:inline-flex sm:w-auto",
          size === "compact" && "gap-0.5"
        )}
      >
        <TabsTrigger value="7d" className={triggerCn}>
          {t("insights.period7d")}
        </TabsTrigger>
        <TabsTrigger value="30d" className={triggerCn}>
          {t("insights.period30d")}
        </TabsTrigger>
        <TabsTrigger value="3m" className={triggerCn}>
          {t("insights.period3m")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
