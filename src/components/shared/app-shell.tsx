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
  /** Lock main column to viewport height on desktop (e.g. full-screen chat). */
  lockDesktopViewport?: boolean
}

export function AppShell({
  children,
  title,
  actions,
  mainClassName,
  hideFooter = false,
  lockDesktopViewport = false,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div
      data-app-shell
      className="overflow-x-hidden bg-slate-50 max-md:flex max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:flex-col max-md:overflow-hidden md:min-h-screen"
    >
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
          "flex min-h-0 flex-1 flex-col transition-all duration-200",
          "max-md:h-full max-md:overflow-hidden",
          "md:ml-[280px] md:min-h-screen",
          lockDesktopViewport
            ? "md:flex md:h-screen md:max-h-screen md:overflow-hidden"
            : "md:h-auto md:overflow-visible"
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
            "mx-auto flex w-full min-w-0 max-w-7xl min-h-0 flex-1 flex-col px-4 py-4",
            "max-md:overflow-y-auto max-md:overscroll-y-contain",
            "pb-[calc(5.25rem+env(safe-area-inset-bottom))]",
            lockDesktopViewport
              ? "max-md:overflow-hidden md:flex-1 md:min-h-0 md:overflow-hidden md:px-6 md:py-0 md:pb-0"
              : "md:overflow-visible md:px-6 md:py-6 md:pb-14",
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
