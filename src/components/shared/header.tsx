"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function Header({ title, actions, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Mobile: Hamburger + Title, Desktop: Title only */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px]"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="min-w-0 truncate text-base font-semibold leading-relaxed text-slate-900 md:text-lg">
            {title}
          </h1>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}
