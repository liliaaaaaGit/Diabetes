"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: "up" | "down" | "stable"
  color?: string
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  color = "teal",
}: StatCardProps) {
  return (
    <Card className="rounded-xl border-slate-100 shadow-sm bg-white">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium text-slate-600 sm:text-xs break-words">
              {label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-slate-900 sm:text-2xl">
                {value}
              </span>
              {unit && (
                <span className="text-[11px] text-slate-500 sm:text-xs">{unit}</span>
              )}
            </div>
            {trend && (
              <div
                className={cn(
                  "text-xs",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-amber-600",
                  trend === "stable" && "text-slate-400"
                )}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trend === "stable" && "→"}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center sm:h-10 sm:w-10",
              color === "teal" && "bg-teal-50 text-teal-600",
              color === "purple" && "bg-cyan-50 text-cyan-600",
              color === "green" && "bg-emerald-50 text-emerald-600",
              color === "pink" && "bg-rose-50 text-rose-500",
              color === "orange" && "bg-amber-50 text-amber-600"
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
