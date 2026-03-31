"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Droplet,
  BookOpen,
  Circle,
  Lightbulb,
  Upload,
  Settings,
  X,
} from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

interface SidebarMobileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SidebarMobile({ open, onOpenChange }: SidebarMobileProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  const handleLinkClick = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[280px] max-w-[85vw] flex-col p-0">
        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Droplet className="h-6 w-6 text-teal-600" />
              <SheetTitle className="font-semibold text-lg text-slate-900">
                GlucoCompanion
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          {/* Main Navigation */}
          <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative min-h-[44px]",
                    isActive
                      ? "bg-slate-100 text-teal-600"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r" />
                  )}
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{t(`nav.${item.key}`)}</span>
                </button>
              )
            })}
          </nav>

          {/* Footer Navigation */}
          <div className="shrink-0 border-t border-slate-200 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 space-y-1">
            {footerNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-600 hover:bg-slate-50 min-h-[44px]",
                    isActive && "bg-slate-100 text-teal-600"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{t(`nav.${item.key}`)}</span>
                </button>
              )
            })}

            {/* Language Switcher */}
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
