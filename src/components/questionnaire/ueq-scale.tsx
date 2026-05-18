"use client"

import { cn } from "@/lib/utils"

interface UeqScaleProps {
  value: number | null
  onChange: (value: number) => void
  leftLabel: string
  rightLabel: string
  name: string
}

const VALUES = [-3, -2, -1, 0, 1, 2, 3] as const

export function UeqScale({ value, onChange, leftLabel, rightLabel, name }: UeqScaleProps) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex justify-between gap-2 text-xs font-medium text-slate-700">
        <span className="max-w-[45%] leading-snug">{leftLabel}</span>
        <span className="max-w-[45%] text-right leading-snug">{rightLabel}</span>
      </div>
      <div className="flex justify-between gap-0.5 overflow-x-auto [-webkit-overflow-scrolling:touch]" role="radiogroup" aria-label={name}>
        {VALUES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-11 min-h-[44px] min-w-[2.25rem] shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors",
              value === v
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300"
            )}
          >
            {v > 0 ? `+${v}` : v}
          </button>
        ))}
      </div>
    </div>
  )
}
