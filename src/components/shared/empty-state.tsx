"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-4">{description}</p>
      {ctaLabel && onCta && (
        <Button onClick={onCta} variant="outline">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
