"use client"

import { useState } from "react"
import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Home, CheckCircle2, XCircle, Inbox } from "lucide-react"

interface Request {
  id: string
  client: string
  service: string
  date: string
  time: string
  duration: string
  address: string
  bedrooms: string
  bathrooms: string
  notes: string
  total: number
  requestedAt: string
  status: "pending" | "accepted" | "declined"
}

const INITIAL_REQUESTS: Request[] = [
  {
    id: "r1",
    client: "Sarah L.",
    service: "Deep Clean",
    date: "Jun 20, 2024",
    time: "9:00 AM",
    duration: "4 hours",
    address: "44 Elm St, Austin, TX",
    bedrooms: "2 BR",
    bathrooms: "1.5",
    notes: "Please focus extra time on the kitchen. My dog (friendly) will be home. Entry code: 4821.",
    total: 138,
    requestedAt: "2 hours ago",
    status: "pending",
  },
  {
    id: "r2",
    client: "Marcus W.",
    service: "Standard Clean",
    date: "Jun 22, 2024",
    time: "11:00 AM",
    duration: "2 hours",
    address: "112 Pine Rd, Austin, TX",
    bedrooms: "1 BR",
    bathrooms: "1",
    notes: "",
    total: 69,
    requestedAt: "5 hours ago",
    status: "pending",
  },
  {
    id: "r3",
    client: "Lucia M.",
    service: "Move-out Clean",
    date: "Jun 25, 2024",
    time: "9:00 AM",
    duration: "5 hours",
    address: "330 Cedar Way, Austin, TX",
    bedrooms: "3 BR",
    bathrooms: "2",
    notes: "Move-out inspection is Jun 26. Needs to pass landlord inspection. Focus on oven, bathrooms, and baseboards.",
    total: 195,
    requestedAt: "1 day ago",
    status: "pending",
  },
  {
    id: "r4",
    client: "Tom B.",
    service: "Standard Clean",
    date: "Jun 18, 2024",
    time: "2:00 PM",
    duration: "3 hours",
    address: "55 Maple Lane",
    bedrooms: "2 BR",
    bathrooms: "1",
    notes: "",
    total: 96,
    requestedAt: "2 days ago",
    status: "accepted",
  },
]

function RequestCard({
  request,
  onAccept,
  onDecline,
}: {
  request: Request
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  return (
    <Card
      className={`border shadow-sm ${
        request.status === "accepted"
          ? "border-primary/20 bg-accent/10"
          : request.status === "declined"
            ? "border-border opacity-60"
            : "border-border"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">
              {request.client[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{request.client}</span>
                <Badge
                  variant={
                    request.status === "accepted"
                      ? "default"
                      : request.status === "declined"
                        ? "outline"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {request.status === "accepted"
                    ? "Accepted"
                    : request.status === "declined"
                      ? "Declined"
                      : "Awaiting response"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Requested {request.requestedAt}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">${request.total}</p>
            <p className="text-xs text-muted-foreground">{request.duration}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {request.date} at {request.time}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            {request.duration}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {request.address}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Home className="size-3.5 shrink-0" />
            {request.bedrooms} · {request.bathrooms} bath
          </div>
        </div>

        <div className="mb-4">
          <span className="text-xs font-medium text-muted-foreground">Service: </span>
          <span className="text-xs font-semibold text-foreground">{request.service}</span>
        </div>

        {request.notes && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Client notes</p>
            <p className="text-xs text-foreground leading-relaxed">{request.notes}</p>
          </div>
        )}

        <Separator className="mb-4" />

        {request.status === "pending" ? (
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-1.5"
              size="sm"
              onClick={() => onAccept(request.id)}
            >
              <CheckCircle2 className="size-3.5" />
              Accept Job
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-destructive hover:text-destructive"
              size="sm"
              onClick={() => onDecline(request.id)}
            >
              <XCircle className="size-3.5" />
              Decline
            </Button>
          </div>
        ) : request.status === "accepted" ? (
          <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <CheckCircle2 className="size-4" />
            Job accepted — added to your schedule
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You declined this request.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function CleanerRequestsPage() {
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS)

  const pending = requests.filter((r) => r.status === "pending")
  const handled = requests.filter((r) => r.status !== "pending")

  const accept = (id: string) =>
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r))
    )
  const decline = (id: string) =>
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "declined" } : r))
    )

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Incoming Requests</h1>
            {pending.length > 0 && (
              <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Review job requests and accept or decline within 24 hours.
          </p>
        </div>

        {pending.length === 0 && handled.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card">
            <Inbox className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">No requests yet</p>
            <p className="text-sm text-muted-foreground">
              Make sure your profile is visible so clients can find and book you.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Needs your response ({pending.length})
                </p>
                {pending.map((r) => (
                  <RequestCard key={r.id} request={r} onAccept={accept} onDecline={decline} />
                ))}
              </>
            )}
            {handled.length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Already handled ({handled.length})
                </p>
                {handled.map((r) => (
                  <RequestCard key={r.id} request={r} onAccept={accept} onDecline={decline} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
