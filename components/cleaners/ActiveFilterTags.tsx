"use client"

import { X } from "lucide-react"
import type { FilterState } from "./FilterSidebar"

interface ActiveFilterTagsProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function ActiveFilterTags({ filters, onChange }: ActiveFilterTagsProps) {
  const tags: { label: string; remove: () => void }[] = []

  filters.services.forEach((s) =>
    tags.push({
      label: s,
      remove: () =>
        onChange({ ...filters, services: filters.services.filter((x) => x !== s) }),
    })
  )

  filters.availability.forEach((a) =>
    tags.push({
      label: a,
      remove: () =>
        onChange({ ...filters, availability: filters.availability.filter((x) => x !== a) }),
    })
  )

  if (filters.maxPrice < 150)
    tags.push({
      label: `Max $${filters.maxPrice}/hr`,
      remove: () => onChange({ ...filters, maxPrice: 150 }),
    })

  if (filters.minRating > 0)
    tags.push({
      label: `${filters.minRating}+ stars`,
      remove: () => onChange({ ...filters, minRating: 0 }),
    })

  if (filters.verified)
    tags.push({ label: "Verified", remove: () => onChange({ ...filters, verified: false }) })

  if (filters.backgroundChecked)
    tags.push({
      label: "Background Checked",
      remove: () => onChange({ ...filters, backgroundChecked: false }),
    })

  if (filters.insured)
    tags.push({ label: "Insured", remove: () => onChange({ ...filters, insured: false }) })

  if (tags.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap" role="list" aria-label="Active filters">
      <span className="text-xs text-muted-foreground font-medium shrink-0">Active:</span>
      {tags.map((tag) => (
        <span
          key={tag.label}
          role="listitem"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium"
        >
          {tag.label}
          <button
            onClick={tag.remove}
            aria-label={`Remove ${tag.label} filter`}
            className="hover:text-teal-900 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
