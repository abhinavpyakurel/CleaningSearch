"use client"

import { CleanerNav } from "@/components/cleaner-nav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Home, Star, BriefcaseBusiness, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Job {
  id: string
  client: string
  service: string
  date: string
  time: string
  duration: string
  address: string
  bedrooms: string
  total: number
  status: "upcoming" | "completed" | "cancelled"
  reviewed?: boolean
}

const JOBS: Job[] = [
  {
    id: "j1",
    client: "Sarah L.",
    service: "Deep Clean",
    date: "Jun 20, 2024",
    time: "9:00 AM",
    duration: "4 hrs",
    address: "44 Elm St",
    bedrooms: "2 BR",
    total: 138,
    status: "upcoming",
  },
  {
    id: "j2",
    client: "Derek P.",
    service: "Standard Clean",
    date: "Jun 22, 2024",
    time: "9:00 AM",
    duration: "3 hrs",
    address: "89 Oak Ave",
    bedrooms: "3 BR",
    total: 96,
    status: "upcoming",
  },
  {
    id: "j3",
    client: "Fiona T.",
    service: "Move-out Clean",
    date: "Jun 25, 2024",
    time: "10:00 AM",
    duration: "5 hrs",
    address: "220 Birch Blvd",
    bedrooms: "2 BR",
    total: 175,
    status: "upcoming",
  },
  {
    id: "j4",
    client: "Tom B.",
    service: "Standard Clean",
    date: "Jun 14, 2024",
    time: "2:00 PM",
    duration: "3 hrs",
    address: "55 Maple Lane",
    bedrooms: "2 BR",
    total: 96,
    status: "completed",
    reviewed: true,
  },
  {
    id: "j5",
    client: "Rachel A.",
    service: "Deep Clean",
    date: "Jun 8, 2024",
    time: "9:00 AM",
    duration: "4 hrs",
    address: "300 River Rd",
    bedrooms: "3 BR",
    total: 138,
    status: "completed",
    reviewed: true,
  },
  {
    id: "j6",
    client: "Greg N.",
    service: "Office Clean",
    date: "Jun 5, 2024",
    time: "6:00 PM",
    duration: "2 hrs",
    address: "10 Business Park",
    bedrooms: "N/A",
    total: 72,
    status: "completed",
    reviewed: false,
  },
  {
    id: "j7",
    client: "Nina O.",
    service: "Standard Clean",
    date: "May 30, 2024",
    time: "10:00 AM",
    duration: "3 hrs",
    address: "67 Bay St",
    bedrooms: "1 BR",
    total: 96,
    status: "cancelled",
  },
]

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="size-11 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground shrink-0">
            {job.client[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-foreground text-sm">{job.client}</span>
              <Badge variant="secondary" className="text-xs">
                {job.service}
              </Badge>
              {job.status === "completed" && job.reviewed && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {job.date} at {job.time}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {job.duration}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {job.address}
              </span>
              {job.bedrooms !== "N/A" && (
                <span className="flex items-center gap-1">
                  <Home className="size-3.5" />
                  {job.bedrooms}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
            <span className="text-base font-bold text-foreground">${job.total}</span>
            {job.status === "upcoming" && (
              <Badge className="text-xs">Upcoming</Badge>
            )}
            {job.status === "completed" && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle2 className="size-3.5" />
                Completed
              </div>
            )}
            {job.status === "cancelled" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="size-3.5" />
                Cancelled
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CleanerJobsPage() {
  const upcoming = JOBS.filter((j) => j.status === "upcoming")
  const completed = JOBS.filter((j) => j.status === "completed")
  const cancelled = JOBS.filter((j) => j.status === "cancelled")

  const totalEarned = completed.reduce((sum, j) => sum + j.total, 0)

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {completed.length} completed &middot; ${totalEarned} earned
            </p>
          </div>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <BriefcaseBusiness className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No upcoming jobs</p>
                <p className="text-sm text-muted-foreground">
                  Accept requests to fill your schedule.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completed.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <CheckCircle2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No completed jobs yet</p>
                <p className="text-sm text-muted-foreground">Completed jobs will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-xl border border-primary/10">
                  <CheckCircle2 className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {completed.length} jobs completed
                    </p>
                    <p className="text-xs text-muted-foreground">${totalEarned} total earned</p>
                  </div>
                </div>
                {completed.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelled.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <XCircle className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No cancelled jobs</p>
                <p className="text-sm text-muted-foreground">Cancelled jobs will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cancelled.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
