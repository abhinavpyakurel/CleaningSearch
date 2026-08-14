"use client"

import Image from "next/image"
import {
  MapPin,
  Clock,
  Heart,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  MessageCircle,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Cleaner } from "@/lib/types"
import { StarRating } from "./StarRating"
import { CleanerBadge } from "./CleanerBadge"
import { AvailabilityChip } from "./AvailabilityChip"
import { Button } from "@/components/ui/button"

interface CleanerListRowProps {
  cleaner: Cleaner
  onViewProfile?: (id: string) => void
  onBook?: (id: string) => void
}

export function CleanerListRow({ cleaner, onViewProfile, onBook }: CleanerListRowProps) {
  const [saved, setSaved] = useState(false)

  return (
    <article
      className={cn(
        "group bg-card rounded-2xl border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden",
        cleaner.featured && "ring-2 ring-teal-500/30"
      )}
      aria-label={`Cleaner profile: ${cleaner.name}`}
    >
      <div className="flex gap-4 p-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border">
            <Image
              src={cleaner.avatar}
              alt={`${cleaner.name} profile photo`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          {cleaner.verified && (
            <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-0.5" title="Verified">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{cleaner.name}</h3>
                {cleaner.featured && (
                  <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{cleaner.tagline}</p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StarRating rating={cleaner.rating} showNumber reviewCount={cleaner.reviewCount} size="sm" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {cleaner.location} · {cleaner.distance}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {cleaner.responseTime}
                </div>
              </div>
            </div>

            {/* Right side: price + save */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  ${cleaner.hourlyRate}
                  <span className="text-xs font-normal text-muted-foreground">/hr</span>
                </p>
                <p className="text-[10px] text-muted-foreground">min {cleaner.minimumHours}hr</p>
              </div>
              <button
                onClick={() => setSaved((s) => !s)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all border border-border hover:bg-muted",
                  saved && "text-rose-500"
                )}
                aria-label={saved ? "Unsave" : "Save"}
              >
                <Heart className={cn("w-4 h-4", saved && "fill-rose-500")} />
              </button>
            </div>
          </div>

          {/* Services & badges */}
          <div className="flex gap-2 flex-wrap mt-3">
            {cleaner.services.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[11px] font-medium rounded-full border border-border">
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <AvailabilityChip availability={cleaner.availability} />
              {cleaner.backgroundChecked && (
                <div className="flex items-center gap-1 text-[11px] text-sky-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Background Checked
                </div>
              )}
              {cleaner.badges.slice(0, 1).map((b) => (
                <CleanerBadge key={b} badge={b} />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewProfile?.(cleaner.id)}>
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </Button>
              <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onBook?.(cleaner.id)}>
                <Briefcase className="w-3.5 h-3.5" />
                Book Now
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
