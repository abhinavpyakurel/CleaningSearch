"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Map } from "lucide-react"

const DEMO_LINKS = [
  {
    section: "Public",
    links: [{ href: "/", label: "Landing Page" }],
  },
  {
    section: "Client",
    links: [
      { href: "/browse/find", label: "Find Cleaners" },
      { href: "/browse/cleaner/1", label: "Cleaner Profile" },
      { href: "/browse/book/1", label: "Booking Flow" },
      { href: "/browse/bookings", label: "My Bookings" },
    ],
  },
  {
    section: "Cleaner",
    links: [
      { href: "/cleaner/dashboard", label: "Dashboard" },
      { href: "/cleaner/requests", label: "Requests" },
      { href: "/cleaner/jobs", label: "Jobs" },
      { href: "/cleaner/availability", label: "Availability" },
      { href: "/cleaner/profile", label: "Profile" },
      { href: "/cleaner/payouts", label: "Payouts" },
      { href: "/cleaner/settings", label: "Settings" },
    ],
  },
]

export function DemoNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "bg-card border border-border rounded-xl shadow-lg overflow-hidden transition-all",
          open ? "w-52" : "w-auto"
        )}
      >
        {open && (
          <div className="p-3 max-h-80 overflow-y-auto">
            {DEMO_LINKS.map(({ section, links }) => (
              <div key={section} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {section}
                </p>
                <div className="flex flex-col gap-0.5">
                  {links.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-md transition-colors",
                        pathname === href
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-muted transition-colors text-sm font-medium text-foreground"
        >
          <Map className="size-4 text-primary shrink-0" />
          {open ? (
            <>
              <span className="flex-1">Demo pages</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </>
          ) : (
            <>
              <span>Demo</span>
              <ChevronUp className="size-3.5 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
