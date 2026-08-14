"use client"

import Image from "next/image"
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Check, Clock3, Heart, Languages, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react"
import type { Cleaner } from "@/lib/types"
import { AvailabilityChip } from "./AvailabilityChip"
import { CleanerBadge } from "./CleanerBadge"
import { StarRating } from "./StarRating"

interface CleanerProfilePanelProps {
  cleaner: Cleaner
  onBack?: () => void
  onRequestBooking?: () => void
}

export function CleanerProfilePanel({ cleaner, onBack, onRequestBooking }: CleanerProfilePanelProps) {
  return (
    <article className="min-h-full bg-card">
      <div className="border-b border-border p-5 lg:p-7">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden">
            <ArrowLeft className="size-4" /> Back to cleaners
          </button>
        )}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Image src={cleaner.avatar} alt={`${cleaner.name}, professional cleaner`} width={112} height={112} className="size-24 rounded-2xl object-cover sm:size-28" priority />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground text-balance">{cleaner.name}</h2>
                  {cleaner.verified && <BadgeCheck className="size-5 text-primary" aria-label="Verified profile" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{cleaner.tagline}</p>
              </div>
              <button type="button" aria-label={`Save ${cleaner.name}`} className="rounded-full border border-border p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Heart className="size-5" /></button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <StarRating rating={cleaner.rating} reviewCount={cleaner.reviewCount} showNumber size="md" />
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" />{cleaner.location} · {cleaner.distance}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <AvailabilityChip availability={cleaner.availability} />
              {cleaner.badges.map((badge) => <CleanerBadge key={badge} badge={badge} />)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 lg:p-7">
        <section aria-labelledby="about-heading">
          <h3 id="about-heading" className="text-base font-semibold text-foreground">About {cleaner.name.split(" ")[0]}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cleaner.bio}</p>
        </section>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: BriefcaseBusiness, label: "Experience", value: `${cleaner.yearsExperience} years` },
            { icon: Sparkles, label: "Jobs completed", value: cleaner.jobsCompleted.toLocaleString() },
            { icon: Clock3, label: "Responds in", value: cleaner.responseTime },
            { icon: Languages, label: "Languages", value: cleaner.languages.join(", ") },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/40 p-3">
              <Icon className="size-4 text-primary" />
              <dt className="mt-2 text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <section aria-labelledby="services-heading">
              <h3 id="services-heading" className="text-base font-semibold text-foreground">Services offered</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {cleaner.services.map((service) => <span key={service} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"><Check className="size-3.5" />{service}</span>)}
              </div>
            </section>

            <section className="mt-7" aria-labelledby="reviews-heading">
              <div className="flex items-end justify-between gap-4">
                <div><h3 id="reviews-heading" className="text-base font-semibold text-foreground">Client reviews</h3><p className="mt-1 text-xs text-muted-foreground">{cleaner.reviewCount} verified reviews</p></div>
                <button className="text-xs font-semibold text-primary hover:underline">View all reviews</button>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {cleaner.reviews.map((review) => (
                  <blockquote key={review.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Image src={review.avatar} alt="" width={36} height={36} className="size-9 rounded-full bg-muted" />
                        <div><p className="text-sm font-semibold text-foreground">{review.author}</p><StarRating rating={review.rating} /></div>
                      </div>
                      <time className="text-xs text-muted-foreground">{review.date}</time>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">“{review.comment}”</p>
                  </blockquote>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-background p-4 lg:sticky lg:top-5" aria-label="Booking summary">
            <p className="text-xs font-medium text-muted-foreground">Starting at</p>
            <p className="mt-1 text-2xl font-bold text-foreground">${cleaner.hourlyRate}<span className="text-sm font-normal text-muted-foreground"> / hour</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{cleaner.minimumHours}-hour minimum</p>
            <div className="my-4 border-t border-border" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Protected booking and secure payment</div>
            <button type="button" onClick={onRequestBooking} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Request to book</button>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"><MessageCircle className="size-4" />Message {cleaner.name.split(" ")[0]}</button>
          </aside>
        </div>
      </div>
    </article>
  )
}
