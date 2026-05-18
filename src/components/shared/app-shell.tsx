"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { SidebarMobile } from "./sidebar-mobile"
import { Header } from "./header"
import { cn } from "@/lib/utils"
import { AppFooter } from "@/components/shared/app-footer"

interface AppShellProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
  /** Override main content wrapper (e.g. full width without max-w-7xl). */
  mainClassName?: string
}

export function AppShell({ children, title, actions, mainClassName }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
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
            "mx-auto max-w-7xl p-4 pb-16 md:p-6 md:pb-14",
            mainClassName
          )}
        >
          {children}
        </main>
      </div>

      <AppFooter />
    </div>
  )
}
