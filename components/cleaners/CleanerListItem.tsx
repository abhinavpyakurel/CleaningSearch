"use client"

import Image from "next/image"
import { BadgeCheck, ChevronRight, MapPin, Star } from "lucide-react"
import type { Cleaner } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CleanerListItemProps {
  cleaner: Cleaner
  selected: boolean
  onSelect: () => void
}

export function CleanerListItem({ cleaner, selected, onSelect }: CleanerListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-accent shadow-sm"
          : "border-transparent bg-card hover:border-border hover:bg-muted/60"
      )}
    >
      <div className="flex gap-3">
        <Image
          src={cleaner.avatar}
          alt={`${cleaner.name}, professional cleaner`}
          width={68}
          height={68}
          className="size-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-sm font-semibold text-foreground">{cleaner.name}</h3>
                {cleaner.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-current text-amber-500" />
                <span className="font-semibold text-foreground">{cleaner.rating.toFixed(1)}</span>
                <span>({cleaner.reviewCount})</span>
                <span aria-hidden>·</span>
                <span>{cleaner.distance}</span>
              </div>
            </div>
            <ChevronRight className={cn("mt-1 size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{cleaner.tagline}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" /> {cleaner.location}
            </span>
            <span className="shrink-0 text-sm font-bold text-foreground">${cleaner.hourlyRate}<span className="text-xs font-normal text-muted-foreground">/hr</span></span>
          </div>
        </div>
      </div>
    </button>
  )
}
