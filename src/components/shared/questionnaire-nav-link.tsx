"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"
import { useQuestionnaireStatus } from "@/hooks/useQuestionnaireStatus"

interface QuestionnaireNavLinkProps {
  href: string
  icon: LucideIcon
  labelKey: string
  collapsed?: boolean
  className?: string
  showActiveBar?: boolean
}

export function QuestionnaireNavLink({
  href,
  icon: Icon,
  labelKey,
  collapsed = false,
  className,
  showActiveBar = true,
}: QuestionnaireNavLinkProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { completed } = useQuestionnaireStatus()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative min-h-[44px]",
        isActive ? "bg-slate-100 text-teal-600" : "text-slate-700 hover:bg-slate-50",
        collapsed && "justify-center",
        className
      )}
    >
      {isActive && showActiveBar && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r" />
      )}
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium flex-1 truncate">{t(labelKey)}</span>
      )}
      {!collapsed && completed && (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
      )}
    </Link>
  )
}
