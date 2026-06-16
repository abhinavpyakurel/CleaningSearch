"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sparkles, Search, CalendarCheck, CreditCard, UserCircle } from "lucide-react"

const navItems = [
  { href: "/browse/find", label: "Find Cleaners", icon: Search },
  { href: "/browse/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/browse/payments", label: "Payments", icon: CreditCard },
  { href: "/browse/profile", label: "Profile", icon: UserCircle },
]

export function ClientNav() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base text-foreground tracking-tight">CleanMatch</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
