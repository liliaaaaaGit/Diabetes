"use client"

import { cn } from "@/lib/utils"

interface LikertScaleProps {
  value: number | null
  onChange: (value: number) => void
  minLabel: string
  maxLabel: string
  name: string
}

const VALUES = [1, 2, 3, 4, 5] as const

export function LikertScale({ value, onChange, minLabel, maxLabel, name }: LikertScaleProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2 text-xs text-slate-500">
        <span className="max-w-[40%] text-left leading-snug">{minLabel}</span>
        <span className="max-w-[40%] text-right leading-snug">{maxLabel}</span>
      </div>
      <div className="flex justify-between gap-1" role="radiogroup" aria-label={name}>
        {VALUES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-11 min-h-[44px] min-w-[44px] flex-1 max-w-[3rem] items-center justify-center rounded-lg border text-sm font-medium transition-colors",
              value === v
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
