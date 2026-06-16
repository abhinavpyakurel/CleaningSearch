"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LogOut, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/client/cleaners",
    label: "Find Cleaners",
    icon: Search,
    isActive: (pathname: string) =>
      pathname.startsWith("/client/cleaners") ||
      pathname.startsWith("/client/book"),
  },
  {
    href: "/client/bookings",
    label: "My Bookings",
    icon: CalendarCheck,
    isActive: (pathname: string) => pathname.startsWith("/client/bookings"),
  },
] as const;

export function ClientNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/client/cleaners"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            CleanMatch
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
          <Link
            href="/logout"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="hidden md:inline">Log out</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
