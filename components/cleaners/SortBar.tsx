"use client"

import { SlidersHorizontal, LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { SORT_OPTIONS } from "@/lib/cleaners-data"

interface SortBarProps {
  sortBy: string
  onSortChange: (v: string) => void
  view: "grid" | "list"
  onViewChange: (v: "grid" | "list") => void
  resultCount: number
  onOpenFilters: () => void
}

export function SortBar({
  sortBy,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  onOpenFilters,
}: SortBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        {/* Mobile filter button */}
        <button
          onClick={onOpenFilters}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{resultCount}</span>{" "}
          cleaner{resultCount !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort select */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-teal-500/30 hover:bg-muted transition-colors"
            aria-label="Sort cleaners"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "p-2 transition-colors",
              view === "grid" ? "bg-teal-600 text-white" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "p-2 transition-colors",
              view === "list" ? "bg-teal-600 text-white" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
