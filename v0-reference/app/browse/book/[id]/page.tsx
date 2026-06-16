"use client"

import { useState } from "react"
import Link from "next/link"
import { ClientNav } from "@/components/client-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Star, ChevronLeft, ChevronRight, ShieldCheck, Clock } from "lucide-react"

const SERVICE_TYPES = ["Standard Clean", "Deep Clean", "Move-out Clean", "Office Clean"]
const DURATIONS = ["2 hours", "3 hours", "4 hours", "5 hours", "6+ hours"]
const BEDROOMS = ["Studio", "1 BR", "2 BR", "3 BR", "4+ BR"]
const BATHROOMS = ["1", "1.5", "2", "2.5", "3+"]

function PriceEstimate({ service, duration }: { service: string; duration: string }) {
  const base = service.includes("Deep") ? 38 : service.includes("Move") ? 42 : service.includes("Office") ? 35 : 32
  const hours = parseInt(duration) || 2
  const subtotal = base * hours
  const fee = Math.round(subtotal * 0.05)
  const total = subtotal + fee
  return (
    <Card className="border border-border shadow-sm bg-card sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Price estimate</CardTitle>
        <CardDescription className="text-xs">Final price confirmed after cleaner accepts.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="size-10 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Maria Santos</p>
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">4.9 · 87 reviews</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">${base}/hr × {hours} hrs</span>
            <span className="text-foreground">${subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee (5%)</span>
            <span className="text-foreground">${fee}</span>
          </div>
        </div>
        <Separator className="mb-3" />
        <div className="flex justify-between text-base font-semibold text-foreground mb-4">
          <span>Estimated total</span>
          <span>${total}</span>
        </div>
        <div className="flex items-start gap-2 p-3 bg-accent/40 rounded-lg">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payment is only charged after the job is completed and you confirm it&apos;s done.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BookingPage({ params }: { params: { id: string } }) {
  const [service, setService] = useState("Standard Clean")
  const [duration, setDuration] = useState("3 hours")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [bedrooms, setBedrooms] = useState("2 BR")
  const [bathrooms, setBathrooms] = useState("1")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <ClientNav />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="size-16 rounded-full bg-accent mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Request sent!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Maria Santos has been notified and will respond within 2 hours. You&apos;ll get a
            confirmation email once she accepts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse/bookings">
              <Button variant="outline">View My Bookings</Button>
            </Link>
            <Link href="/browse/find">
              <Button>Find More Cleaners</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href={`/browse/cleaner/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to profile
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Request a Booking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in your job details. Maria will review and confirm.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Service type */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service type</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TYPES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setService(s)}
                      className={`text-sm px-3 py-2.5 rounded-lg border font-medium transition-colors text-left ${
                        service === s
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date & time */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Date & time</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start time</label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Estimated duration</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          duration === d
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Home details */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Home details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bedrooms</label>
                  <div className="flex flex-wrap gap-2">
                    {BEDROOMS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBedrooms(b)}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          bedrooms === b
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Bathrooms</label>
                  <div className="flex flex-wrap gap-2">
                    {BATHROOMS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBathrooms(b)}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          bathrooms === b
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Service address
                  </label>
                  <Input
                    placeholder="123 Main St, Austin, TX 78701"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Special instructions</CardTitle>
                <CardDescription>Anything Maria should know before arriving.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  placeholder="e.g. Focus extra time on the kitchen. Dog will be at home but friendly. Entry code is 4821."
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              Maria typically responds within 2 hours.
            </div>

            <Button size="lg" className="gap-2" onClick={() => setSubmitted(true)}>
              Send Booking Request
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Price sidebar */}
          <div>
            <PriceEstimate service={service} duration={duration} />
          </div>
        </div>
      </div>
    </div>
  )
}
