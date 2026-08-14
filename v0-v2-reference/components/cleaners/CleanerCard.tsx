"use client"

import Image from "next/image"
import {
  MapPin,
  Clock,
  Briefcase,
  Heart,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Cleaner } from "@/lib/types"
import { StarRating } from "./StarRating"
import { CleanerBadge } from "./CleanerBadge"
import { AvailabilityChip } from "./AvailabilityChip"
import { Button } from "@/components/ui/button"

interface CleanerCardProps {
  cleaner: Cleaner
  onViewProfile?: (id: string) => void
  onBook?: (id: string) => void
}

export function CleanerCard({ cleaner, onViewProfile, onBook }: CleanerCardProps) {
  const [saved, setSaved] = useState(false)

  return (
    <article
      className={cn(
        "group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        cleaner.featured && "ring-2 ring-teal-500/30"
      )}
      aria-label={`Cleaner profile: ${cleaner.name}`}
    >
      {/* Featured ribbon */}
      {cleaner.featured && (
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-teal-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-br-lg tracking-wide uppercase">
            Featured
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={() => setSaved((s) => !s)}
        className={cn(
          "absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
          "bg-background/80 backdrop-blur-sm border border-border hover:bg-background",
          saved && "text-rose-500"
        )}
        aria-label={saved ? "Unsave cleaner" : "Save cleaner"}
      >
        <Heart className={cn("w-4 h-4", saved && "fill-rose-500")} />
      </button>

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border">
              <Image
                src={cleaner.avatar}
                alt={`${cleaner.name} profile photo`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            {cleaner.verified && (
              <div
                className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-0.5"
                title="Verified cleaner"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-[15px] leading-tight">
                  {cleaner.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {cleaner.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <StarRating
                rating={cleaner.rating}
                showNumber
                reviewCount={cleaner.reviewCount}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                {cleaner.location} · {cleaner.distance}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-xl p-3">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              ${cleaner.hourlyRate}
              <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Hourly Rate</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-sm font-bold text-foreground">{cleaner.yearsExperience}yr</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Experience</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {cleaner.jobsCompleted >= 1000
                ? `${(cleaner.jobsCompleted / 1000).toFixed(1)}k`
                : cleaner.jobsCompleted}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Jobs Done</p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex items-center gap-2 flex-wrap">
          {cleaner.backgroundChecked && (
            <div className="flex items-center gap-1 text-[11px] text-sky-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Background Checked
            </div>
          )}
          {cleaner.insured && (
            <div className="flex items-center gap-1 text-[11px] text-sky-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Insured
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Responds {cleaner.responseTime}
          </div>
        </div>

        {/* Services */}
        <div className="flex gap-1.5 flex-wrap">
          {cleaner.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[11px] font-medium rounded-full border border-border"
            >
              {service}
            </span>
          ))}
          {cleaner.services.length > 3 && (
            <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[11px] rounded-full border border-border">
              +{cleaner.services.length - 3} more
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-1.5 flex-wrap">
          {cleaner.badges.slice(0, 2).map((badge) => (
            <CleanerBadge key={badge} badge={badge} />
          ))}
        </div>

        {/* Availability */}
        <AvailabilityChip availability={cleaner.availability} />

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onViewProfile?.(cleaner.id)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => onBook?.(cleaner.id)}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Book Now
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}
