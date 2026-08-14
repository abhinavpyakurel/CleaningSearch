"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeCheck, Sparkles } from "lucide-react"
import { CLEANERS } from "@/lib/cleaners-data"
import type { Cleaner } from "@/lib/types"
import { CleanerListItem } from "./CleanerListItem"
import { CleanerProfilePanel } from "./CleanerProfilePanel"
import { EmptyState } from "./EmptyState"
import { FilterSidebar, type FilterState } from "./FilterSidebar"
import { FilterToolbar } from "./FilterToolbar"

const DEFAULT_FILTERS: FilterState = {
  services: [],
  availability: [],
  minRating: 0,
  maxPrice: 150,
  backgroundChecked: false,
  insured: false,
  verified: false,
}

function sortCleaners(cleaners: Cleaner[], sortBy: string) {
  const results = [...cleaners]
  if (sortBy === "rating") return results.sort((a, b) => b.rating - a.rating)
  if (sortBy === "price_low") return results.sort((a, b) => a.hourlyRate - b.hourlyRate)
  if (sortBy === "price_high") return results.sort((a, b) => b.hourlyRate - a.hourlyRate)
  if (sortBy === "reviews") return results.sort((a, b) => b.reviewCount - a.reviewCount)
  if (sortBy === "experience") return results.sort((a, b) => b.yearsExperience - a.yearsExperience)
  return results.sort((a, b) => Number(b.featured) - Number(a.featured))
}

export function BrowseCleaners() {
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState("featured")
  const [selectedId, setSelectedId] = useState(CLEANERS[0].id)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    let results = CLEANERS
    if (search.trim()) {
      const query = search.toLowerCase()
      results = results.filter((cleaner) => cleaner.name.toLowerCase().includes(query) || cleaner.tagline.toLowerCase().includes(query) || cleaner.bio.toLowerCase().includes(query) || cleaner.services.some((service) => service.toLowerCase().includes(query)))
    }
    if (location.trim()) results = results.filter((cleaner) => cleaner.location.toLowerCase().includes(location.toLowerCase()))
    if (filters.services.length) results = results.filter((cleaner) => filters.services.every((service) => cleaner.services.includes(service)))
    if (filters.availability.length) results = results.filter((cleaner) => filters.availability.includes(cleaner.availability))
    if (filters.minRating) results = results.filter((cleaner) => cleaner.rating >= filters.minRating)
    if (filters.maxPrice < 150) results = results.filter((cleaner) => cleaner.hourlyRate <= filters.maxPrice)
    if (filters.backgroundChecked) results = results.filter((cleaner) => cleaner.backgroundChecked)
    if (filters.insured) results = results.filter((cleaner) => cleaner.insured)
    if (filters.verified) results = results.filter((cleaner) => cleaner.verified)
    return sortCleaners(results, sortBy)
  }, [search, location, filters, sortBy])

  useEffect(() => {
    if (filtered.length && !filtered.some((cleaner) => cleaner.id === selectedId)) setSelectedId(filtered[0].id)
    if (!filtered.length) setMobileDetailOpen(false)
  }, [filtered, selectedId])

  const selectedCleaner = filtered.find((cleaner) => cleaner.id === selectedId) ?? filtered[0]
  const resetAll = () => {
    setSearch("")
    setLocation("")
    setFilters(DEFAULT_FILTERS)
    setSortBy("featured")
  }
  const selectCleaner = (id: string) => {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></span>
            <div><p className="text-base font-bold text-foreground">SparkleFind</p><p className="text-xs text-muted-foreground">Trusted cleaners, one click away</p></div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><BadgeCheck className="size-4 text-primary" />Every professional is identity verified</div>
        </div>
      </header>

      <FilterToolbar search={search} location={location} filters={filters} sortBy={sortBy} resultCount={filtered.length} onSearchChange={setSearch} onLocationChange={setLocation} onFiltersChange={setFilters} onSortChange={setSortBy} onOpenAllFilters={() => setMobileFiltersOpen(true)} onReset={resetAll} />

      <div className="md:hidden">
        <FilterSidebar filters={filters} onChange={setFilters} mobileOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} />
      </div>

      <main className="mx-auto flex w-full max-w-[1500px] flex-1 min-h-0 px-4 py-4 sm:px-6">
        {filtered.length === 0 ? (
          <div className="w-full rounded-2xl border border-border bg-card"><EmptyState onReset={resetAll} /></div>
        ) : (
          <div className="grid w-full min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:h-[calc(100vh-190px)] md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)]">
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-border md:border-r" aria-label="Cleaner results">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div><h1 className="text-sm font-semibold text-foreground">Cleaners near you</h1><p className="mt-0.5 text-xs text-muted-foreground">{filtered.length} results · Select to view details</p></div>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">Best match</span>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto p-2">
                {filtered.map((cleaner) => <CleanerListItem key={cleaner.id} cleaner={cleaner} selected={cleaner.id === selectedCleaner?.id} onSelect={() => selectCleaner(cleaner.id)} />)}
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">More trusted professionals join every week</p>
              </div>
            </section>

            <section className="hidden min-h-0 overflow-y-auto md:block" aria-live="polite">
              {selectedCleaner && <CleanerProfilePanel key={selectedCleaner.id} cleaner={selectedCleaner} />}
            </section>
          </div>
        )}
      </main>

      {mobileDetailOpen && selectedCleaner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:hidden">
          <CleanerProfilePanel key={selectedCleaner.id} cleaner={selectedCleaner} onBack={() => setMobileDetailOpen(false)} />
        </div>
      )}
    </div>
  )
}
