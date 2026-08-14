"use client"

import { SlidersHorizontal, X, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { SERVICE_OPTIONS, AVAILABILITY_OPTIONS } from "@/lib/cleaners-data"
import type { ServiceType, Availability } from "@/lib/types"

export interface FilterState {
  services: ServiceType[]
  availability: Availability[]
  minRating: number
  maxPrice: number
  backgroundChecked: boolean
  insured: boolean
  verified: boolean
}

interface FilterSidebarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  mobileOpen: boolean
  onClose: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h4>
  )
}

export function FilterSidebar({ filters, onChange, mobileOpen, onClose }: FilterSidebarProps) {
  const updateFilters = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial })

  const toggleService = (s: ServiceType) => {
    const next = filters.services.includes(s)
      ? filters.services.filter((x) => x !== s)
      : [...filters.services, s]
    updateFilters({ services: next })
  }

  const toggleAvailability = (a: Availability) => {
    const next = filters.availability.includes(a)
      ? filters.availability.filter((x) => x !== a)
      : [...filters.availability, a]
    updateFilters({ availability: next })
  }

  const resetFilters = () =>
    onChange({
      services: [],
      availability: [],
      minRating: 0,
      maxPrice: 150,
      backgroundChecked: false,
      insured: false,
      verified: false,
    })

  const hasActiveFilters =
    filters.services.length > 0 ||
    filters.availability.length > 0 ||
    filters.minRating > 0 ||
    filters.maxPrice < 150 ||
    filters.backgroundChecked ||
    filters.insured ||
    filters.verified

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-card z-50 border-r border-border overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:h-auto lg:w-full lg:z-auto lg:border lg:rounded-2xl lg:overflow-visible",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Filter options"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-foreground text-sm">Filters</h3>
              {hasActiveFilters && (
                <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6">
            <SectionTitle>Services</SectionTitle>
            <div className="space-y-2">
              {SERVICE_OPTIONS.map((service) => (
                <label
                  key={service}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      filters.services.includes(service as ServiceType)
                        ? "bg-teal-600 border-teal-600"
                        : "border-border group-hover:border-teal-400"
                    )}
                    onClick={() => toggleService(service as ServiceType)}
                  >
                    {filters.services.includes(service as ServiceType) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-sm text-foreground"
                    onClick={() => toggleService(service as ServiceType)}
                  >
                    {service}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <SectionTitle>Availability</SectionTitle>
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((avail) => (
                <label key={avail} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      filters.availability.includes(avail as Availability)
                        ? "bg-teal-600 border-teal-600"
                        : "border-border group-hover:border-teal-400"
                    )}
                    onClick={() => toggleAvailability(avail as Availability)}
                  >
                    {filters.availability.includes(avail as Availability) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-sm text-foreground"
                    onClick={() => toggleAvailability(avail as Availability)}
                  >
                    {avail}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="mb-6">
            <SectionTitle>Max Hourly Rate</SectionTitle>
            <div className="px-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>$10/hr</span>
                <span className="font-semibold text-foreground">
                  {filters.maxPrice >= 150 ? "Any price" : `$${filters.maxPrice}/hr`}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={filters.maxPrice}
                onChange={(e) => updateFilters({ maxPrice: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
                aria-label="Maximum hourly rate"
              />
            </div>
          </div>

          {/* Minimum rating */}
          <div className="mb-6">
            <SectionTitle>Minimum Rating</SectionTitle>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => updateFilters({ minRating: r })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    filters.minRating === r
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-muted text-muted-foreground border-border hover:border-teal-400"
                  )}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div className="mb-2">
            <SectionTitle>Trust & Safety</SectionTitle>
            <div className="space-y-2">
              {(
                [
                  { key: "verified", label: "Verified Profile" },
                  { key: "backgroundChecked", label: "Background Checked" },
                  { key: "insured", label: "Insured" },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      filters[key]
                        ? "bg-teal-600 border-teal-600"
                        : "border-border group-hover:border-teal-400"
                    )}
                    onClick={() => updateFilters({ [key]: !filters[key] })}
                  >
                    {filters[key] && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 9 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-sm text-foreground"
                    onClick={() => updateFilters({ [key]: !filters[key] })}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
