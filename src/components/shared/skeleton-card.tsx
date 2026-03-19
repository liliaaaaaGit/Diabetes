"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("rounded-xl border-slate-200 shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
          <div className="h-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
