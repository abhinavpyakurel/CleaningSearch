"use client"

import { CleanerNav } from "@/components/cleaner-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Wallet,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react"

const PAYOUT_HISTORY = [
  {
    id: "p1",
    period: "Jun 10 – Jun 16, 2024",
    jobs: 4,
    gross: 528,
    fee: 53,
    net: 475,
    status: "paid",
    paidOn: "Jun 18, 2024",
  },
  {
    id: "p2",
    period: "Jun 3 – Jun 9, 2024",
    jobs: 3,
    gross: 402,
    fee: 40,
    net: 362,
    status: "paid",
    paidOn: "Jun 11, 2024",
  },
  {
    id: "p3",
    period: "May 27 – Jun 2, 2024",
    jobs: 5,
    gross: 670,
    fee: 67,
    net: 603,
    status: "paid",
    paidOn: "Jun 4, 2024",
  },
  {
    id: "p4",
    period: "May 20 – May 26, 2024",
    jobs: 2,
    gross: 234,
    fee: 23,
    net: 211,
    status: "paid",
    paidOn: "May 28, 2024",
  },
]

const PENDING_JOBS = [
  { client: "Sarah L.", service: "Deep Clean", date: "Jun 20", amount: 138 },
  { client: "Derek P.", service: "Standard Clean", date: "Jun 22", amount: 96 },
  { client: "Fiona T.", service: "Move-out Clean", date: "Jun 25", amount: 175 },
]

const stripeConnected = false

export default function CleanerPayoutsPage() {
  const totalEarned = PAYOUT_HISTORY.reduce((s, p) => s + p.net, 0)
  const pendingTotal = PENDING_JOBS.reduce((s, j) => s + j.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <CleanerNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your earnings and manage your payout account.
          </p>
        </div>

        {/* Stripe status banner */}
        {!stripeConnected ? (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-900">Stripe account not connected</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Connect your Stripe account to receive weekly payouts for completed jobs. Until then, your earnings will accumulate but cannot be transferred.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white border-0"
            >
              Connect Stripe
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-accent/30 border border-primary/10 rounded-xl mb-6">
            <CheckCircle2 className="size-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Stripe connected</p>
              <p className="text-xs text-muted-foreground">
                Payouts are deposited every Friday to your bank account ending in ···4521.
              </p>
            </div>
          </div>
        )}

        {/* Earnings summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">All-time net earnings</p>
              </div>
              <p className="text-2xl font-bold text-foreground">${totalEarned.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Pending (upcoming jobs)</p>
              </div>
              <p className="text-2xl font-bold text-foreground">${pendingTotal}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{PENDING_JOBS.length} jobs</p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownToLine className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Next payout</p>
              </div>
              {stripeConnected ? (
                <>
                  <p className="text-2xl font-bold text-foreground">$412</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jun 21, 2024</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect Stripe to receive</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payout history */}
          <div className="lg:col-span-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payout history</CardTitle>
                <CardDescription>Weekly payouts from completed jobs.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {PAYOUT_HISTORY.length === 0 ? (
                  <div className="py-10 text-center">
                    <Wallet className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payouts yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {PAYOUT_HISTORY.map((p, i) => (
                      <div key={p.id}>
                        {i > 0 && <Separator className="my-3" />}
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-foreground">{p.period}</p>
                              <Badge variant="secondary" className="text-xs">
                                {p.jobs} jobs
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Gross: ${p.gross}</span>
                              <span>Fee: -${p.fee}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                              <CheckCircle2 className="size-3" />
                              Paid {p.paidOn}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-foreground">${p.net}</p>
                            <p className="text-xs text-muted-foreground">net</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming earnings */}
          <div>
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upcoming earnings</CardTitle>
                <CardDescription className="text-xs">Jobs scheduled but not yet completed.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-3">
                  {PENDING_JOBS.map((j, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-foreground">{j.client}</p>
                        <p className="text-xs text-muted-foreground">{j.service} · {j.date}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span className="text-xs font-medium">${j.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-foreground">Total pending</span>
                  <span className="text-foreground">${pendingTotal}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Platform fee (10%) will be deducted at payout.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
