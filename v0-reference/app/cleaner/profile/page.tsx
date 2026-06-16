"use client"

import { useState } from "react"
import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Eye, EyeOff, X, Plus } from "lucide-react"

const ALL_SERVICES = [
  "Standard Clean",
  "Deep Clean",
  "Move-out Clean",
  "Office Clean",
  "Eco Clean",
  "Post-Reno Clean",
  "Airbnb Turnover",
]

export default function CleanerProfilePage() {
  const [visible, setVisible] = useState(true)
  const [rate, setRate] = useState("32")
  const [radius, setRadius] = useState("10")
  const [bio, setBio] = useState(
    "Thorough and detail-oriented cleaning professional with 5+ years of experience. Specializes in deep cleans and move-out services. I use eco-friendly products by default and am happy to accommodate any special requests or sensitivities."
  )
  const [services, setServices] = useState<string[]>(["Standard Clean", "Deep Clean", "Move-out Clean"])
  const [saved, setSaved] = useState(false)

  const toggleService = (s: string) => {
    setSaved(false)
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This is what clients see when they find you on CleanMatch.
          </p>
        </div>

        {/* Visibility toggle */}
        <Card className="border shadow-sm mb-6 border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">Profile visibility</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {visible
                    ? "Clients can find and book you via search."
                    : "You are hidden from search. Existing bookings still apply."}
                </p>
              </div>
              <button
                onClick={() => { setVisible(!visible); setSaved(false) }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  visible ? "bg-primary" : "bg-input"
                }`}
                role="switch"
                aria-checked={visible}
              >
                <span
                  className={`pointer-events-none inline-block size-5 rounded-full bg-card shadow-sm transition-transform ${
                    visible ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {visible ? (
                <>
                  <Eye className="size-3.5 text-primary" />
                  <span className="text-xs text-primary font-medium">Visible to clients</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Hidden from search</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rates & radius */}
        <Card className="border border-border shadow-sm mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rates & service area</CardTitle>
            <CardDescription>Your hourly rate and how far you&apos;re willing to travel.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Hourly rate (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => { setRate(e.target.value); setSaved(false) }}
                    className="pl-7"
                    min={15}
                    max={200}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Max travel radius (miles)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => { setRadius(e.target.value); setSaved(false) }}
                    className="pr-10"
                    min={1}
                    max={50}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mi</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="border border-border shadow-sm mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bio</CardTitle>
            <CardDescription>Tell clients about your experience and approach. Keep it honest and specific.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setSaved(false) }}
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">{bio.length}/500</p>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border border-border shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Services offered</CardTitle>
            <CardDescription>Select all cleaning types you&apos;re comfortable performing.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map((s) => {
                const active = services.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleService(s)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      active
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {active ? <X className="size-3" /> : <Plus className="size-3" />}
                    {s}
                  </button>
                )
              })}
            </div>
            {services.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <p className="text-xs text-muted-foreground w-full mb-1">Selected:</p>
                {services.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        <div className="flex items-center gap-3">
          <Button
            className="gap-2"
            onClick={() => setSaved(true)}
          >
            Save Changes
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
              <CheckCircle2 className="size-4" />
              Changes saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
