"use client"

import { Search, MapPin, X } from "lucide-react"

interface SearchBarProps {
  search: string
  location: string
  onSearchChange: (v: string) => void
  onLocationChange: (v: string) => void
}

export function SearchBar({
  search,
  location,
  onSearchChange,
  onLocationChange,
}: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-2xl border border-border shadow-sm p-2">
      {/* Keyword search */}
      <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-muted/50 focus-within:bg-muted transition-colors">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search by name or service…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          aria-label="Search cleaners"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 sm:w-56 px-3 py-2 rounded-xl bg-muted/50 focus-within:bg-muted transition-colors">
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Location or zip code"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          aria-label="Filter by location"
        />
        {location && (
          <button
            onClick={() => onLocationChange("")}
            aria-label="Clear location"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search button */}
      <button className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shrink-0">
        Search
      </button>
    </div>
  )
}
