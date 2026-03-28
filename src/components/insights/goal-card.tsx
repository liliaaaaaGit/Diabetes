"use client"

import { Target, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/useTranslation"
import { updateGoalProgress } from "@/lib/db"
import type { Goal } from "@/lib/types"
import { useState } from "react"

interface GoalCardProps {
  goal: Goal
  userId: string | null
  onComplete: () => void
}

export function GoalCard({ goal, userId, onComplete }: GoalCardProps) {
  const { t } = useTranslation()
  const [isCompleting, setIsCompleting] = useState(false)
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null)

  const progress = goal.targetDays > 0 ? (goal.completedDays / goal.targetDays) * 100 : 0
  const isCompleted = goal.completedDays >= goal.targetDays
  const today = new Date().toDateString()

  const handleComplete = async () => {
    // Prevent multiple completions per day
    if (lastCompletedDate === today) return

    if (!userId) return
    setIsCompleting(true)
    try {
      await updateGoalProgress(goal.id, goal.completedDays + 1, userId)
      setLastCompletedDate(today)
      onComplete()
    } catch (error) {
      console.error("Failed to update goal progress:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-900">{goal.title}</h3>
              {isCompleted && (
                <Badge variant="default" className="bg-green-600 text-white">
                  {t("insights.goalCompleted")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 mb-3">{goal.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{t("insights.goalProgress", { current: goal.completedDays, total: goal.targetDays })}</span>
                <span className="font-medium text-slate-900">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            {!isCompleted && (
              <Button
                onClick={handleComplete}
                disabled={isCompleting || lastCompletedDate === today}
                size="sm"
                variant="outline"
                className="mt-3 w-full"
              >
                {isCompleting ? t("common.loading") : t("insights.goalMarkToday")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
