"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, LogOut, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/cleaner/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) =>
      pathname === "/cleaner/dashboard" ||
      pathname.startsWith("/cleaner/jobs/") ||
      pathname.startsWith("/cleaner/onboarding") ||
      pathname.startsWith("/cleaner/payouts/"),
  },
  {
    href: "/cleaner/requests",
    label: "Requests",
    icon: Inbox,
    isActive: (pathname: string) => pathname.startsWith("/cleaner/requests"),
  },
] as const;

export function CleanerNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/cleaner/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="hidden text-base font-semibold tracking-tight text-foreground sm:inline">
            CleanMatch
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon, isActive }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                isActive(pathname)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
          <Link
            href="/logout"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="hidden lg:inline">Log out</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
