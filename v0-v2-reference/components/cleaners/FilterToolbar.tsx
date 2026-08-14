"use client"

import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react"
import { AVAILABILITY_OPTIONS, SERVICE_OPTIONS, SORT_OPTIONS } from "@/lib/cleaners-data"
import type { Availability, ServiceType } from "@/lib/types"
import type { FilterState } from "./FilterSidebar"

interface FilterToolbarProps {
  search: string
  location: string
  filters: FilterState
  sortBy: string
  resultCount: number
  onSearchChange: (value: string) => void
  onLocationChange: (value: string) => void
  onFiltersChange: (filters: FilterState) => void
  onSortChange: (value: string) => void
  onOpenAllFilters: () => void
  onReset: () => void
}

const selectClass = "appearance-none rounded-xl border border-border bg-card py-2.5 pl-3 pr-8 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring"

export function FilterToolbar({ search, location, filters, sortBy, resultCount, onSearchChange, onLocationChange, onFiltersChange, onSortChange, onOpenAllFilters, onReset }: FilterToolbarProps) {
  const hasFilters = search || location || filters.services.length || filters.availability.length || filters.minRating > 0 || filters.maxPrice < 150 || filters.backgroundChecked || filters.insured || filters.verified
  const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial })

  return (
    <section className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6" aria-label="Search and filter cleaners">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Search cleaners</span>
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by cleaner or service" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Clear search"><X className="size-4 text-muted-foreground" /></button>}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 md:w-64 focus-within:ring-2 focus-within:ring-ring">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Location</span>
            <input value={location} onChange={(event) => onLocationChange(event.target.value)} placeholder="Location or ZIP" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </label>
          <button type="button" onClick={onOpenAllFilters} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted md:hidden"><SlidersHorizontal className="size-4" />Filters</button>
        </div>

        <div className="hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
          <Select value={filters.services[0] ?? ""} onChange={(value) => update({ services: value ? [value as ServiceType] : [] })} label="All services" options={SERVICE_OPTIONS.map((value) => ({ value, label: value }))} />
          <Select value={filters.availability[0] ?? ""} onChange={(value) => update({ availability: value ? [value as Availability] : [] })} label="Any availability" options={AVAILABILITY_OPTIONS.map((value) => ({ value, label: value }))} />
          <Select value={String(filters.maxPrice)} onChange={(value) => update({ maxPrice: Number(value) })} label="Any price" options={[{ value: "35", label: "Up to $35/hr" }, { value: "45", label: "Up to $45/hr" }, { value: "60", label: "Up to $60/hr" }, { value: "150", label: "Any price" }]} />
          <Select value={String(filters.minRating)} onChange={(value) => update({ minRating: Number(value) })} label="Any rating" options={[{ value: "4", label: "4.0+ rating" }, { value: "4.5", label: "4.5+ rating" }, { value: "4.8", label: "4.8+ rating" }, { value: "0", label: "Any rating" }]} />
          <button type="button" onClick={() => update({ backgroundChecked: !filters.backgroundChecked })} className={`shrink-0 rounded-xl border px-3 py-2.5 text-sm font-medium ${filters.backgroundChecked ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>Background checked</button>
          <button type="button" onClick={() => update({ insured: !filters.insured })} className={`shrink-0 rounded-xl border px-3 py-2.5 text-sm font-medium ${filters.insured ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>Insured</button>
          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            {hasFilters && <button type="button" onClick={onReset} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Clear all</button>}
            <Select value={sortBy} onChange={onSortChange} label="Sort" options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground md:hidden"><span className="font-semibold text-foreground">{resultCount}</span> cleaners found</p>
      </div>
    </section>
  )
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: { value: string; label: string }[] }) {
  return <div className="relative shrink-0"><select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass} aria-label={label}><option value="">{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /></div>
}
