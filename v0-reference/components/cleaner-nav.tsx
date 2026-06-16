"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  LayoutDashboard,
  Inbox,
  BriefcaseBusiness,
  CalendarDays,
  UserCog,
  Wallet,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/cleaner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cleaner/requests", label: "Requests", icon: Inbox },
  { href: "/cleaner/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/cleaner/availability", label: "Availability", icon: CalendarDays },
  { href: "/cleaner/profile", label: "Profile", icon: UserCog },
  { href: "/cleaner/payouts", label: "Payouts", icon: Wallet },
  { href: "/cleaner/settings", label: "Settings", icon: Settings },
]

export function CleanerNav() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base text-foreground tracking-tight hidden sm:inline">CleanMatch</span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                pathname === href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
