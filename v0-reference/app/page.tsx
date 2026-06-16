import Link from "next/link"
import { PublicNavbar } from "@/components/public-navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Star,
  ShieldCheck,
  Clock,
  CreditCard,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
} from "lucide-react"

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your location",
    description:
      "Tell us your ZIP or city and the type of cleaning you need. We show you vetted pros nearby.",
  },
  {
    step: "02",
    title: "Pick a cleaner",
    description:
      "Compare profiles, read verified reviews, and check availability before you book.",
  },
  {
    step: "03",
    title: "Confirm your booking",
    description:
      "Choose a date, share home details, and pay securely. Your cleaner gets notified instantly.",
  },
]

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "ID-verified cleaners",
    description:
      "Every cleaner on CleanMatch is identity-checked and reviewed before they can accept jobs.",
  },
  {
    icon: Star,
    title: "Verified reviews",
    description:
      "Reviews come only from real clients who completed a booking — no fake stars.",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    description:
      "Pay safely through the platform. Funds are only released after you confirm the job is done.",
  },
  {
    icon: Clock,
    title: "No back-and-forth",
    description:
      "Structured booking flow means everything is clear upfront — time, price, and scope.",
  },
]

const SAMPLE_CLEANERS = [
  {
    name: "Maria S.",
    rating: 4.9,
    reviews: 87,
    rate: "$32/hr",
    radius: "10 mi",
    badge: "Top Rated",
    available: true,
    services: ["Standard", "Deep Clean", "Move-out"],
  },
  {
    name: "James K.",
    rating: 4.8,
    reviews: 54,
    rate: "$28/hr",
    radius: "8 mi",
    badge: null,
    available: true,
    services: ["Standard", "Office"],
  },
  {
    name: "Priya M.",
    rating: 5.0,
    reviews: 31,
    rate: "$35/hr",
    radius: "12 mi",
    badge: "New",
    available: false,
    services: ["Standard", "Deep Clean"],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0 gap-1.5">
              <Sparkles className="size-3" />
              Trusted by 12,000+ clients
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance mb-4">
              Book trusted local cleaners without the back-and-forth.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 text-pretty">
              CleanMatch connects you with vetted, reviewed cleaning professionals in your area. Set
              your schedule, confirm your price, done.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/browse/find">
                <Button size="lg" className="gap-2">
                  <Search className="size-4" />
                  Find a Cleaner
                </Button>
              </Link>
              <Link href="/auth/signup?role=cleaner">
                <Button size="lg" variant="outline" className="gap-2">
                  Become a Cleaner
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search card */}
          <div className="mt-12 max-w-2xl">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-foreground mb-4">Find cleaners near you</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 border border-input rounded-lg px-3 py-2.5 bg-background">
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="ZIP or city"
                      className="text-sm bg-transparent outline-none w-full placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex items-center gap-2 border border-input rounded-lg px-3 py-2.5 bg-background">
                    <Sparkles className="size-4 text-muted-foreground shrink-0" />
                    <select className="text-sm bg-transparent outline-none w-full text-muted-foreground">
                      <option value="">Cleaning type</option>
                      <option>Standard Clean</option>
                      <option>Deep Clean</option>
                      <option>Move-out Clean</option>
                      <option>Office Clean</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 border border-input rounded-lg px-3 py-2.5 bg-background">
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <input
                      type="date"
                      className="text-sm bg-transparent outline-none w-full text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button className="w-full sm:w-auto">Search Cleaners</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-6 items-center justify-center sm:justify-start">
          {[
            { icon: Users, text: "2,400+ active cleaners" },
            { icon: CheckCircle2, text: "98% booking satisfaction" },
            { icon: Briefcase, text: "54,000 jobs completed" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={text} className="flex items-center gap-2 text-primary-foreground">
              {i > 0 && (
                <Separator orientation="vertical" className="h-4 bg-primary-foreground/30 hidden sm:block mr-4" />
              )}
              <Icon className="size-4" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            How CleanMatch works
          </h2>
          <p className="text-muted-foreground mb-10">Three steps from search to a clean home.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="flex gap-5">
                <div className="shrink-0 size-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-accent-foreground">{step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Sample cleaner cards */}
      <section className="py-16 md:py-20 bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Meet some of our cleaners
          </h2>
          <p className="text-muted-foreground mb-8">Real professionals. Real reviews.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_CLEANERS.map((c) => (
              <Card key={c.name} className="border border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-accent flex items-center justify-center font-semibold text-accent-foreground">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-foreground">{c.rating}</span>
                          <span className="text-xs text-muted-foreground">({c.reviews})</span>
                        </div>
                      </div>
                    </div>
                    {c.badge && (
                      <Badge
                        variant={c.badge === "Top Rated" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {c.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.services.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {c.rate} &middot; {c.radius}
                    </span>
                    <span
                      className={`text-xs font-medium ${c.available ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {c.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/browse/find">
              <Button variant="outline" className="gap-2">
                View all cleaners
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why CleanMatch */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Why clients trust CleanMatch
          </h2>
          <p className="text-muted-foreground mb-10">We built the platform around your peace of mind.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 size-10 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Cleaner CTA */}
      <section className="py-16 md:py-20 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              For cleaning professionals
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
              Grow your cleaning business on your terms.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-pretty">
              Set your own rates, control your availability, and get paid reliably. CleanMatch
              handles the bookings — you focus on the work.
            </p>
            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "No upfront fees — pay only when you earn",
                "Manage your schedule with a simple availability tool",
                "Get paid every week via Stripe",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup?role=cleaner">
              <Button size="lg" className="gap-2">
                Apply as a Cleaner
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">CleanMatch</span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              {["About", "How it works", "For Cleaners", "Support", "Privacy", "Terms"].map(
                (link) => (
                  <Link key={link} href="#" className="hover:text-foreground transition-colors">
                    {link}
                  </Link>
                )
              )}
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground">
            &copy; 2024 CleanMatch Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
