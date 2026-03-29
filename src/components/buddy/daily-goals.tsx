"use client"

import { Target, CircleDashed, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { cn } from "@/lib/utils"

export interface BuddyDailyGoal {
  id: string
  text: string
  completed: boolean
}

interface DailyGoalsProps {
  goals: BuddyDailyGoal[]
  onToggle: (goal: BuddyDailyGoal) => void
}

export function DailyGoals({ goals, onToggle }: DailyGoalsProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t("buddy.dailyImpulse")}</h2>
          <p className="text-sm text-slate-500">{t("buddy.basedOnConversations")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {goals.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => onToggle(goal)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-teal-100/80 bg-teal-50/30 p-4 text-left shadow-sm"
          >
            <span className={cn("text-sm text-slate-700", goal.completed && "text-slate-500 line-through")}>
              {goal.text}
            </span>
            {goal.completed ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            ) : (
              <CircleDashed className="h-5 w-5 text-slate-400" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
