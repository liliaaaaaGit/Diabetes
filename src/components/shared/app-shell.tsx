"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { SidebarMobile } from "./sidebar-mobile"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"

interface AppShellProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
  /** Override main content wrapper (e.g. full width without max-w-7xl). */
  mainClassName?: string
}

export function AppShell({ children, title, actions, mainClassName }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <SidebarMobile
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "transition-all duration-200",
          "md:ml-[280px]" // Desktop: offset by sidebar width
        )}
      >
        {/* Header */}
        <Header
          title={title}
          actions={actions}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Content */}
        <main
          className={cn(
            "max-w-7xl mx-auto p-4 md:p-6",
            mainClassName
          )}
        >
          {children}
        </main>

        {/* Safety notice for mobile (sidebar is hidden) */}
        <div className="md:hidden px-4 pb-6">
          <p className="text-xs text-slate-500">{t("safety.notice")}</p>
        </div>
      </div>
    </div>
  )
}
