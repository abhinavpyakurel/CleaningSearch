import Link from "next/link"
import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  Star,
  Inbox,
  Wallet,
} from "lucide-react"

const STATS = [
  { label: "Earnings this month", value: "$1,248", icon: DollarSign, change: "+12%" },
  { label: "Jobs completed", value: "38", icon: Briefcase, change: "+4" },
  { label: "Avg. rating", value: "4.9", icon: Star, change: null },
  { label: "New requests", value: "3", icon: Inbox, change: null, highlight: true },
]

const UPCOMING_JOBS = [
  {
    id: "j1",
    client: "Sarah L.",
    service: "Deep Clean",
    date: "Today",
    time: "2:00 PM",
    duration: "4 hrs",
    address: "44 Elm St",
    total: 138,
  },
  {
    id: "j2",
    client: "Derek P.",
    service: "Standard Clean",
    date: "Tomorrow",
    time: "9:00 AM",
    duration: "3 hrs",
    address: "89 Oak Ave",
    total: 96,
  },
  {
    id: "j3",
    client: "Fiona T.",
    service: "Move-out Clean",
    date: "Jun 21",
    time: "10:00 AM",
    duration: "5 hrs",
    address: "220 Birch Blvd",
    total: 175,
  },
]

const AVAIL_SUMMARY = [
  { day: "Mon", open: true },
  { day: "Tue", open: true },
  { day: "Wed", open: false },
  { day: "Thu", open: true },
  { day: "Fri", open: true },
  { day: "Sat", open: true },
  { day: "Sun", open: false },
]

export default function CleanerDashboard() {
  const isVisible = true
  const isPayoutSetup = false

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good morning, Maria.</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s what&apos;s on your plate today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${
                isVisible
                  ? "bg-accent text-accent-foreground border-primary/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              {isVisible ? "Visible to clients" : "Hidden from search"}
            </div>
          </div>
        </div>

        {/* Action required banner */}
        {!isPayoutSetup && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-900">Action required: Set up payouts</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Connect your Stripe account to receive payments for completed jobs.
              </p>
            </div>
            <Link href="/cleaner/payouts">
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 shrink-0">
                Set up now
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ label, value, icon: Icon, change, highlight }) => (
            <Card
              key={label}
              className={`border shadow-sm ${highlight ? "border-primary/30 bg-accent/40" : "border-border"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={`size-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <p className={`text-2xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
                  {value}
                </p>
                {change && (
                  <p className="text-xs text-muted-foreground mt-0.5">{change} this month</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming jobs */}
          <div className="lg:col-span-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming jobs</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Your next {UPCOMING_JOBS.length} scheduled jobs
                  </CardDescription>
                </div>
                <Link href="/cleaner/jobs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col">
                  {UPCOMING_JOBS.map((job, i) => (
                    <div key={job.id}>
                      {i > 0 && <Separator className="my-3" />}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground text-sm shrink-0">
                            {job.client[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-foreground">{job.client}</span>
                              <Badge variant="secondary" className="text-xs">
                                {job.service}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {job.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {job.time} · {job.duration}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{job.address}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          ${job.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Pending requests */}
            <Card className="border border-primary/20 bg-accent/20 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Inbox className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">3 pending requests</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  New job requests are waiting for your response.
                </p>
                <Link href="/cleaner/requests">
                  <Button size="sm" className="w-full gap-1.5">
                    Review Requests
                    <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Availability summary */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Availability this week</CardTitle>
                <Link href="/cleaner/availability">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                    Edit <ChevronRight className="size-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-1.5">
                  {AVAIL_SUMMARY.map(({ day, open }) => (
                    <div key={day} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs text-muted-foreground">{day}</span>
                      <div
                        className={`w-full h-2 rounded-full ${open ? "bg-primary" : "bg-muted"}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  5 of 7 days open this week
                </p>
              </CardContent>
            </Card>

            {/* Payout status */}
            <Card className="border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Payout status</span>
                </div>
                {isPayoutSetup ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Next payout</p>
                    <p className="text-lg font-bold text-foreground">$412.00</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Scheduled for Jun 21</p>
                  </div>
                ) : (
                  <div>
                    <Badge variant="secondary" className="text-xs mb-2">Not connected</Badge>
                    <p className="text-xs text-muted-foreground mb-3">
                      Connect Stripe to receive weekly payouts.
                    </p>
                    <Link href="/cleaner/payouts">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Connect Stripe
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
