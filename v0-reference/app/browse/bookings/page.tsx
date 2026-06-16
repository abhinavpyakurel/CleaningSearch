"use client"

import { useState } from "react"
import Link from "next/link"
import { ClientNav } from "@/components/client-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Calendar, Clock, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react"

type BookingStatus = "upcoming" | "pending" | "completed" | "cancelled"

interface Booking {
  id: string
  cleanerName: string
  service: string
  date: string
  time: string
  duration: string
  address: string
  total: number
  status: BookingStatus
  paymentStatus: "paid" | "processing" | "pending" | "refunded"
}

const BOOKINGS: Booking[] = [
  {
    id: "b1",
    cleanerName: "Maria Santos",
    service: "Deep Clean",
    date: "Jun 20, 2024",
    time: "9:00 AM",
    duration: "4 hours",
    address: "123 Main St, Austin, TX",
    total: 158,
    status: "upcoming",
    paymentStatus: "paid",
  },
  {
    id: "b2",
    cleanerName: "James Kowalski",
    service: "Standard Clean",
    date: "Jun 18, 2024",
    time: "3:00 PM",
    duration: "3 hours",
    address: "123 Main St, Austin, TX",
    total: 89,
    status: "pending",
    paymentStatus: "pending",
  },
  {
    id: "b3",
    cleanerName: "Anika Osei",
    service: "Standard Clean",
    date: "Jun 5, 2024",
    time: "10:00 AM",
    duration: "2 hours",
    address: "123 Main St, Austin, TX",
    total: 69,
    status: "completed",
    paymentStatus: "paid",
  },
  {
    id: "b4",
    cleanerName: "Carlos Rivera",
    service: "Office Clean",
    date: "May 28, 2024",
    time: "2:00 PM",
    duration: "3 hours",
    address: "456 Work Ave, Austin, TX",
    total: 95,
    status: "completed",
    paymentStatus: "paid",
  },
  {
    id: "b5",
    cleanerName: "Thomas Brennan",
    service: "Deep Clean",
    date: "May 15, 2024",
    time: "9:00 AM",
    duration: "5 hours",
    address: "123 Main St, Austin, TX",
    total: 215,
    status: "cancelled",
    paymentStatus: "refunded",
  },
]

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "outline"; color: string }
> = {
  upcoming: { label: "Upcoming", variant: "default", color: "text-primary" },
  pending: { label: "Awaiting Confirmation", variant: "secondary", color: "text-muted-foreground" },
  completed: { label: "Completed", variant: "outline", color: "text-foreground" },
  cancelled: { label: "Cancelled", variant: "outline", color: "text-destructive" },
}

const PAYMENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, color: "text-primary" },
  processing: { label: "Payment processing", icon: Loader2, color: "text-muted-foreground" },
  pending: { label: "Pending payment", icon: Clock, color: "text-muted-foreground" },
  refunded: { label: "Refunded", icon: XCircle, color: "text-muted-foreground" },
}

function BookingCard({ booking }: { booking: Booking }) {
  const status = STATUS_CONFIG[booking.status]
  const payment = PAYMENT_CONFIG[booking.paymentStatus]
  const PayIcon = payment.icon

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="size-12 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground shrink-0">
            {booking.cleanerName[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-foreground text-sm">{booking.cleanerName}</span>
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>

            <p className="text-sm font-medium text-foreground mb-2">{booking.service}</p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {booking.date} at {booking.time}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {booking.duration}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {booking.address}
              </span>
            </div>

            <Separator className="mb-3" />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <PayIcon className={`size-3.5 ${payment.color}`} />
                <span className={`text-xs font-medium ${payment.color}`}>{payment.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">${booking.total}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            {booking.status === "completed" && (
              <Button variant="outline" size="sm" className="gap-1.5">
                <Star className="size-3.5" />
                Leave Review
              </Button>
            )}
            {booking.status === "upcoming" && (
              <>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Cancel
                </Button>
              </>
            )}
            {booking.status === "pending" && (
              <Button variant="outline" size="sm" className="gap-1.5">
                <ChevronRight className="size-3.5" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyBookingsPage() {
  const upcoming = BOOKINGS.filter((b) => b.status === "upcoming" || b.status === "pending")
  const completed = BOOKINGS.filter((b) => b.status === "completed")
  const cancelled = BOOKINGS.filter((b) => b.status === "cancelled")

  return (
    <div className="min-h-screen bg-background">
      <ClientNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all your cleaning appointments.</p>
          </div>
          <Link href="/browse/find">
            <Button size="sm" className="gap-1.5">
              Book Again
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming{" "}
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
                <Calendar className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No upcoming bookings</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Find a cleaner and schedule your first appointment.
                </p>
                <Link href="/browse/find">
                  <Button size="sm">Find a Cleaner</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completed.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <CheckCircle2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No completed bookings yet</p>
                <p className="text-sm text-muted-foreground">Completed jobs will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {completed.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelled.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
                <XCircle className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">No cancelled bookings</p>
                <p className="text-sm text-muted-foreground">Cancelled jobs will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cancelled.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
