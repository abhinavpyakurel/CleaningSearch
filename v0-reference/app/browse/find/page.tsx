"use client"

import { useState } from "react"
import Link from "next/link"
import { ClientNav } from "@/components/client-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Search, SlidersHorizontal, Clock, ChevronRight } from "lucide-react"

const CLEANERS = [
  {
    id: "1",
    name: "Maria Santos",
    rating: 4.9,
    reviews: 87,
    rate: 32,
    radius: 10,
    available: true,
    badge: "Top Rated",
    bio: "Thorough and detail-oriented. Specializes in deep cleans and move-out services. 5+ years experience.",
    services: ["Standard", "Deep Clean", "Move-out"],
    nextAvail: "Tomorrow",
  },
  {
    id: "2",
    name: "James Kowalski",
    rating: 4.8,
    reviews: 54,
    rate: 28,
    radius: 8,
    available: true,
    badge: null,
    bio: "Reliable, punctual, and always leaves the space spotless. Office and residential specialist.",
    services: ["Standard", "Office"],
    nextAvail: "Today, 3 PM",
  },
  {
    id: "3",
    name: "Priya Mehta",
    rating: 5.0,
    reviews: 31,
    rate: 35,
    radius: 12,
    available: false,
    badge: "New",
    bio: "Former hospitality cleaner with a hotel-grade attention to detail. 100% 5-star reviews so far.",
    services: ["Standard", "Deep Clean"],
    nextAvail: "Jun 20",
  },
  {
    id: "4",
    name: "Carlos Rivera",
    rating: 4.7,
    reviews: 112,
    rate: 30,
    radius: 15,
    available: true,
    badge: null,
    bio: "High-volume cleaner with 3 years on CleanMatch. Consistent and communicative.",
    services: ["Standard", "Deep Clean", "Office"],
    nextAvail: "Today, 5 PM",
  },
  {
    id: "5",
    name: "Anika Osei",
    rating: 4.9,
    reviews: 43,
    rate: 33,
    radius: 7,
    available: true,
    badge: "Top Rated",
    bio: "Eco-friendly products only. Specializes in homes with pets or allergies.",
    services: ["Standard", "Eco Clean"],
    nextAvail: "Tomorrow",
  },
  {
    id: "6",
    name: "Thomas Brennan",
    rating: 4.6,
    reviews: 28,
    rate: 26,
    radius: 20,
    available: false,
    badge: null,
    bio: "Flexible scheduling and great with large homes. Experienced in post-renovation cleanup.",
    services: ["Standard", "Post-Reno"],
    nextAvail: "Jun 22",
  },
]

const SERVICE_TYPES = ["All", "Standard", "Deep Clean", "Move-out", "Office", "Eco Clean"]
const SORT_OPTIONS = ["Best Match", "Highest Rated", "Lowest Price", "Nearest"]

export default function FindCleanersPage() {
  const [search, setSearch] = useState("")
  const [activeService, setActiveService] = useState("All")
  const [sortBy, setSortBy] = useState("Best Match")

  const filtered = CLEANERS.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.services.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    const matchService =
      activeService === "All" || c.services.includes(activeService)
    return matchSearch && matchService
  })

  return (
    <div className="min-h-screen bg-background">
      <ClientNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Find a Cleaner</h1>
          <p className="text-muted-foreground text-sm">
            Showing cleaners near <span className="font-medium text-foreground">Austin, TX</span>
          </p>
        </div>

        {/* Search + filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or service..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-card outline-none text-foreground"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Service type pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SERVICE_TYPES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveService(s)}
              className={`text-sm px-3.5 py-1.5 rounded-full font-medium border transition-colors ${
                activeService === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} cleaner{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Cleaner cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
            <MapPin className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">No cleaners found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((c) => (
              <Card key={c.id} className="border border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar */}
                    <div className="size-14 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground text-lg shrink-0">
                      {c.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{c.name}</h3>
                        {c.badge && (
                          <Badge
                            variant={c.badge === "Top Rated" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {c.badge}
                          </Badge>
                        )}
                        <span
                          className={`text-xs font-medium ml-auto ${c.available ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {c.available ? "Available" : "Not available"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{c.rating}</span>
                          <span>({c.reviews} reviews)</span>
                        </span>
                        <span className="text-border">·</span>
                        <span>${c.rate}/hr</span>
                        <span className="text-border">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {c.radius} mi
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.bio}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {c.services.map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>Next: {c.nextAvail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Link href={`/browse/cleaner/${c.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/browse/book/${c.id}`} className="flex-1 sm:flex-none">
                        <Button size="sm" className="w-full gap-1">
                          Request Booking
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
