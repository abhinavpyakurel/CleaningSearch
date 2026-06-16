"use client"

import { useState } from "react"
import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Info } from "lucide-react"

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

const DEFAULT_SCHEDULE: Record<DayKey, DaySchedule> = {
  Mon: { enabled: true, start: "09:00", end: "17:00" },
  Tue: { enabled: true, start: "09:00", end: "17:00" },
  Wed: { enabled: false, start: "09:00", end: "17:00" },
  Thu: { enabled: true, start: "09:00", end: "17:00" },
  Fri: { enabled: true, start: "09:00", end: "17:00" },
  Sat: { enabled: true, start: "10:00", end: "14:00" },
  Sun: { enabled: false, start: "10:00", end: "14:00" },
}

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_LABELS: Record<DayKey, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE)
  const [saved, setSaved] = useState(false)

  const toggle = (day: DayKey) => {
    setSaved(false)
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  const update = (day: DayKey, field: "start" | "end", value: string) => {
    setSaved(false)
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const enabledCount = DAYS.filter((d) => schedule[d].enabled).length

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Availability</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set the days and hours you&apos;re available to take jobs. Clients can only book during your open windows.
          </p>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-2 mb-6 p-3.5 bg-accent/30 rounded-xl border border-primary/10">
          <Info className="size-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            You&apos;re open <span className="font-semibold">{enabledCount} of 7 days</span> this week.
          </p>
        </div>

        <Card className="border border-border shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly schedule</CardTitle>
            <CardDescription>Toggle days on/off and set your working hours.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-1">
              {DAYS.map((day, i) => (
                <div key={day}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(day)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        schedule[day].enabled ? "bg-primary" : "bg-input"
                      }`}
                      role="switch"
                      aria-checked={schedule[day].enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 rounded-full bg-card shadow-sm ring-0 transition-transform ${
                          schedule[day].enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Day label */}
                    <span
                      className={`w-24 text-sm font-medium ${
                        schedule[day].enabled ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </span>

                    {/* Time inputs */}
                    {schedule[day].enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule[day].start}
                          onChange={(e) => update(day, "start", e.target.value)}
                          className="text-sm border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={schedule[day].end}
                          onChange={(e) => update(day, "end", e.target.value)}
                          className="text-sm border border-input rounded-lg px-2.5 py-1.5 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground/60 italic">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date-specific overrides hint */}
        <div className="p-4 border border-border rounded-xl bg-card mb-6">
          <p className="text-sm font-medium text-foreground mb-1">Need a day off?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For one-off closures (vacation, appointments), disable specific days using the toggles above. Your weekly schedule resets automatically each week.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="gap-2"
            onClick={() => setSaved(true)}
          >
            Save Availability
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
              <CheckCircle2 className="size-4" />
              Saved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
