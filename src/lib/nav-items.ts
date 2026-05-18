import type { LucideIcon } from "lucide-react"
import { BookOpen, Circle, ClipboardList, Droplet, Lightbulb, Settings } from "lucide-react"

export type NavItemKey =
  | "dashboard"
  | "logbook"
  | "buddy"
  | "insights"
  | "questionnaire"
  | "settings"

export const mainNavItems: { href: string; icon: LucideIcon; key: NavItemKey }[] = [
  { href: "/", icon: Droplet, key: "dashboard" },
  { href: "/logbook", icon: BookOpen, key: "logbook" },
  { href: "/buddy", icon: Circle, key: "buddy" },
  { href: "/insights", icon: Lightbulb, key: "insights" },
  { href: "/study/questionnaire", icon: ClipboardList, key: "questionnaire" },
]

export const footerNavItems: { href: string; icon: LucideIcon; key: NavItemKey }[] = [
  { href: "/settings", icon: Settings, key: "settings" },
]
