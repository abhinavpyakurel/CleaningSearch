import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  MessageSquareQuote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { PublicNav } from "@/components/public-nav";
import { StarRating } from "@/components/cleaners/StarRating";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { roleHomePath } from "@/lib/auth";
import { getProfileRole } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    icon: Search,
    title: "Discover a cleaner",
    description:
      "Browse local profiles with rates, ratings, and real availability near you.",
  },
  {
    icon: CalendarCheck,
    title: "Request a booking",
    description:
      "Pick a time, share home details, and send a request in a few taps.",
  },
  {
    icon: CheckCircle2,
    title: "Confirm & pay",
    description:
      "Your cleaner accepts, you see the full price upfront (including the 15% service fee), and pay securely.",
  },
  {
    icon: Star,
    title: "Clean & review",
    description:
      "After the job, leave a rating so the next household knows what to expect.",
  },
] as const;

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Verified cleaners",
    description:
      "Profiles are reviewed before cleaners can accept jobs on the platform.",
  },
  {
    icon: CreditCard,
    title: "Transparent pricing",
    description:
      "Hourly rates plus a clear 15% service fee—no surprise add-ons at checkout.",
  },
  {
    icon: Clock,
    title: "24-hour cancellation",
    description:
      "Cancel more than 24 hours ahead for a refund of the cleaner’s portion per our policy.",
  },
  {
    icon: Star,
    title: "Reviews & ratings",
    description:
      "Only completed bookings unlock reviews, so scores reflect real jobs.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description:
      "Card payments stay on the platform. You’re never asked to pay cleaners off-app.",
  },
  {
    icon: MessageSquareQuote,
    title: "Direct matching",
    description:
      "You choose the cleaner—not a random assignment—so fit and trust come first.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Alicia R.",
    role: "Homeowner · Austin",
    rating: 5,
    quote:
      "I booked a deep clean in under ten minutes. The rate was clear, my cleaner confirmed the same day, and the place looked great.",
  },
  {
    name: "Marcus T.",
    role: "Renter · Round Rock",
    rating: 4.8,
    quote:
      "Loved being able to compare ratings and availability side by side. Felt more like hiring someone I researched than rolling the dice.",
  },
  {
    name: "Priya S.",
    role: "Cleaner · San Marcos",
    rating: 5,
    quote:
      "I set my own hours and rates. Clients come through CleanMatch already knowing the price—less haggling, more cleaning.",
  },
] as const;

const FAQS = [
  {
    q: "How do bookings work?",
    a: "Browse cleaners, send a request with your preferred time and home details, then wait for the cleaner to confirm. Once accepted, your booking moves to confirmed and you manage it from your account.",
  },
  {
    q: "What’s included in the price?",
    a: "You pay the cleaner’s hourly rate plus a 15% CleanMatch service fee shown before you book. Estimated hours are based on bedrooms, bathrooms, and clean type.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Cancellations more than 24 hours before the scheduled time follow our refund rules for the cleaner’s portion. The platform service fee is non-refundable after the booking is confirmed.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed securely through CleanMatch (Stripe). You should never send cash or pay a cleaner outside the app for a CleanMatch booking.",
  },
  {
    q: "Are cleaners vetted?",
    a: "Cleaners create profiles and go through platform review before accepting jobs. Always check ratings, reviews, and profile details before you book.",
  },
  {
    q: "What if something goes wrong?",
    a: "Open the booking in your account to report an issue. Flags are reviewed by a person—we don’t auto-deactivate accounts without review.",
  },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { role } = await getProfileRole(supabase, user.id);
    if (role === "client" || role === "cleaner") {
      redirect(roleHomePath(role));
    }
  }

  return (
    <div className="flex min-h-screen scroll-smooth flex-col bg-background">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate min-h-screen overflow-hidden">
          <Image
            src="/HeaderImage1.jpg"
            alt="Cleaner wiping a kitchen counter in a bright home"
            fill
            priority
            className="object-cover object-[72%_center]"
            sizes="100vw"
          />
          <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 pt-16 sm:px-6">
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
                CleanMatch
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                Book a trusted local cleaner without the chase.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Compare verified cleaners near you, see rates upfront, and
                manage the booking in one place—from request to review.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="gap-2"
                  render={<Link href="/register" />}
                >
                  Find a cleaner
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  render={<Link href="/register" />}
                >
                  Become a cleaner
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-muted-foreground">
                Four clear steps from search to a finished clean.
              </p>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title}>
                    <Card className="h-full border-border/80 transition-shadow duration-200 hover:shadow-md">
                      <CardHeader className="gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                            <Icon className="size-5" />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <CardTitle className="text-base">{step.title}</CardTitle>
                        <CardDescription className="leading-relaxed">
                          {step.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 bg-muted/40 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Built for peace of mind
              </h2>
              <p className="mt-2 text-muted-foreground">
                Specific guardrails—not vague promises—around price, trust, and
                cancellations.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="h-full border-border/80 transition-shadow duration-200 hover:shadow-md"
                  >
                    <CardHeader className="gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                      <CardDescription className="leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section id="stories" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  What people are saying
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Placeholder stories you can swap for real client and cleaner
                  quotes later.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                <StarRating rating={4.9} showNumber reviewCount={1280} />
                <span className="text-xs text-muted-foreground">
                  avg. platform rating
                </span>
              </div>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <Card
                  key={item.name}
                  className="h-full border-border/80 transition-shadow duration-200 hover:shadow-md"
                >
                  <CardContent className="flex h-full flex-col gap-4 pt-6">
                    <StarRating rating={item.rating} size="sm" showNumber />
                    <p className="flex-1 text-sm leading-relaxed text-foreground">
                      “{item.quote}”
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                FAQ & safety
              </h2>
              <p className="mt-2 text-muted-foreground">
                Short answers on bookings, money, and trust.
              </p>
            </div>
            <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  className="group px-4 py-1 open:bg-muted/30 sm:px-5"
                >
                  <summary className="cursor-pointer list-none py-4 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-y border-border bg-accent/40">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 sm:py-14">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Create a free account to browse cleaners—or join as a pro and
                set your own schedule.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />}>
                Find a cleaner
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register" />}
              >
                Become a cleaner
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="size-4 text-primary-foreground" />
                </div>
                <span className="text-base font-semibold tracking-tight text-foreground">
                  CleanMatch
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                A home cleaning marketplace for booking trusted local cleaners
                with clear pricing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Product
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#how-it-works"
                      className="transition-colors hover:text-foreground"
                    >
                      How it works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="transition-colors hover:text-foreground"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="transition-colors hover:text-foreground"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Legal
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#privacy"
                      className="transition-colors hover:text-foreground"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#terms"
                      className="transition-colors hover:text-foreground"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Contact
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="mailto:support@cleanmatch.app"
                      className="transition-colors hover:text-foreground"
                    >
                      support@cleanmatch.app
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-foreground"
                    >
                      Log in
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div
            id="privacy"
            className="scroll-mt-20 grid gap-6 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2"
          >
            <div>
              <p className="font-semibold text-foreground">Privacy Policy</p>
              <p className="mt-2">
                Placeholder: CleanMatch collects account and booking information
                to operate the marketplace. We do not sell personal data. Full
                policy copy can replace this section later.
              </p>
            </div>
            <div id="terms" className="scroll-mt-20">
              <p className="font-semibold text-foreground">Terms of Service</p>
              <p className="mt-2">
                Placeholder: By using CleanMatch you agree to book and pay
                through the platform, follow cancellation rules, and treat
                cleaners and clients respectfully. Replace with final legal
                terms before launch.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} CleanMatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
