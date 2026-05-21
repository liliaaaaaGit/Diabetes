"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface InsightsChartFrameProps {
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Lightweight section wrapper for insights charts (no heavy card chrome). */
export function InsightsChartFrame({ title, children, footer, className }: InsightsChartFrameProps) {
  return (
    <section className={cn("w-full space-y-3", className)}>
      {title ? <h2 className="mobile-section-title text-slate-900">{title}</h2> : null}
      <div className="w-full">{children}</div>
      {footer ? <div>{footer}</div> : null}
    </section>
  )
}

export function insightsChartMinWidth(pointCount: number): number {
  return Math.max(300, pointCount * 36)
}

export function InsightsChartScrollArea({
  pointCount,
  heightClass = "h-[280px] md:h-[320px]",
  children,
}: {
  pointCount: number
  heightClass?: string
  children: ReactNode
}) {
  return (
    <div className="w-full overflow-x-auto px-0.5 [-webkit-overflow-scrolling:touch]">
      <div className={heightClass} style={{ minWidth: insightsChartMinWidth(pointCount) }}>
        {children}
      </div>
    </div>
  )
}
