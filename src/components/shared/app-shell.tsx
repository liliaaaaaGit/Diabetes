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
  hideFooter?: boolean
}

export function AppShell({ children, title, actions, mainClassName, hideFooter = false }: AppShellProps) {
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
          "flex min-h-screen min-h-[100dvh] flex-col transition-all duration-200",
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
            "mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-4",
            "pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 md:pb-14",
            mainClassName
          )}
        >
          {children}
        </main>
      </div>

      {!hideFooter && <AppFooter />}
    </div>
  )
}
