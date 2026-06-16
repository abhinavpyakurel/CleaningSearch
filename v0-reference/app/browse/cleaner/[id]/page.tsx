import Link from "next/link"
import { ClientNav } from "@/components/client-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Clock, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react"

const REVIEWS = [
  {
    author: "Sarah L.",
    rating: 5,
    date: "May 28, 2024",
    text: "Maria was absolutely thorough. Every corner was spotless — better than any cleaner I've hired before.",
  },
  {
    author: "Derek P.",
    rating: 5,
    date: "May 14, 2024",
    text: "Showed up exactly on time, worked efficiently, and communicated throughout. Will rebook without hesitation.",
  },
  {
    author: "Fiona T.",
    rating: 4,
    date: "Apr 30, 2024",
    text: "Great job overall. The kitchen was immaculate. Took a little longer than estimated but the quality was worth it.",
  },
]

const AVAILABILITY = [
  { day: "Mon", slots: ["9:00 AM", "1:00 PM"] },
  { day: "Tue", slots: ["9:00 AM"] },
  { day: "Wed", slots: [] },
  { day: "Thu", slots: ["11:00 AM", "3:00 PM"] },
  { day: "Fri", slots: ["9:00 AM", "1:00 PM"] },
  { day: "Sat", slots: ["10:00 AM"] },
  { day: "Sun", slots: [] },
]

export default function CleanerProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <ClientNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/browse/find"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to results
        </Link>

        {/* Profile header */}
        <Card className="border border-border shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="size-20 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground text-2xl shrink-0">
                M
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold text-foreground">Maria Santos</h1>
                      <Badge className="text-xs">Top Rated</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-foreground">4.9</span>
                        <span>(87 reviews)</span>
                      </span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        Austin, TX · 10 mi radius
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">$32</p>
                    <p className="text-sm text-muted-foreground">/hour</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Thorough and detail-oriented cleaning professional with 5+ years of experience.
                  Specializes in deep cleans and move-out services. I use eco-friendly products by
                  default and am happy to accommodate any special requests or sensitivities.
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {["Standard", "Deep Clean", "Move-out", "Eco-Friendly"].map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Link href={`/browse/book/${params.id}`}>
                <Button size="lg" className="gap-2">
                  Request Booking
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Verified points */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Verified details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2.5">
                  {[
                    "Identity verified",
                    "Background check passed",
                    "87 completed jobs on CleanMatch",
                    "Member since March 2022",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-5">
                  {REVIEWS.map((r, i) => (
                    <div key={i}>
                      {i > 0 && <Separator className="mb-5" />}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {r.author[0]}
                          </div>
                          <span className="text-sm font-medium text-foreground">{r.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`size-3.5 ${j < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Availability */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Availability this week</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2">
                  {AVAILABILITY.map(({ day, slots }) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-8">{day}</span>
                      {slots.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {slots.map((slot) => (
                            <span
                              key={slot}
                              className="text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                    <Clock className="size-3.5" />
                    Next available: Tomorrow, 9:00 AM
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA repeat */}
            <Card className="border border-border shadow-sm bg-accent/30">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-foreground mb-1">Ready to book?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Confirm your job details and Maria will respond within 2 hours.
                </p>
                <Link href={`/browse/book/${params.id}`}>
                  <Button className="w-full gap-2" size="sm">
                    Request Booking
                    <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
