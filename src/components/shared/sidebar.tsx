"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Droplet,
  BookOpen,
  Circle,
  Lightbulb,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { href: "/", icon: Droplet, key: "dashboard" },
  { href: "/logbook", icon: BookOpen, key: "logbook" },
  { href: "/buddy", icon: Circle, key: "buddy" },
  { href: "/insights", icon: Lightbulb, key: "insights" },
]

const footerNavItems = [
  { href: "/import", icon: Upload, key: "import" },
  { href: "/settings", icon: Settings, key: "settings" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const { pseudonym } = useUser()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-200 z-40",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Droplet className="h-6 w-6 text-teal-600" />
              <span className="font-semibold text-lg text-slate-900">
                GlucoCompanion
              </span>
            </div>
          ) : (
            <Droplet className="h-6 w-6 text-teal-600 mx-auto" />
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="absolute top-16 right-0 translate-x-1/2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full bg-white border-slate-200 shadow-sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative",
                  isActive
                    ? "bg-slate-100 text-teal-600"
                    : "text-slate-700 hover:bg-slate-50",
                  collapsed && "justify-center"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r" />
                )}
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{t(`nav.${item.key}`)}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        {pseudonym && !collapsed && (
          <div className="px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{t("auth.hello")}</p>
            <p className="text-sm font-medium text-slate-900">{pseudonym}</p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="border-t border-slate-200 py-4 px-3 space-y-1">
          {footerNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-600 hover:bg-slate-50",
                  isActive && "bg-slate-100 text-teal-600",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm">{t(`nav.${item.key}`)}</span>
                )}
              </Link>
            )
          })}

          {/* Language Switcher */}
          {!collapsed && (
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex gap-1">
      <Button
        variant={locale === "de" ? "default" : "outline"}
        size="sm"
        className="flex-1 h-8 text-xs"
        onClick={() => setLocale("de")}
      >
        DE
      </Button>
      <Button
        variant={locale === "en" ? "default" : "outline"}
        size="sm"
        className="flex-1 h-8 text-xs"
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  )
}
