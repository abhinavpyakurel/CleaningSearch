import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { DashboardEmptyState } from "@/app/cleaner/_components/dashboard-empty-state";
import { PayoutSetupBanner } from "@/app/cleaner/dashboard/payout-setup-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPayoutStatusLabel } from "@/lib/booking-completion";
import {
  computeCleanerEarningsSummary,
  getPaidOutBookings,
  getRecentEarningsBookings,
  hasAnyEarnings,
  type CleanerEarningsBooking,
} from "@/lib/cleaner-earnings";
import { formatUsdFromCents } from "@/lib/booking-price";
import { createClient } from "@/lib/supabase/server";

const earningsSelect =
  "id, scheduled_at, status, payment_status, payout_status, cleaner_payout_cents, platform_fee_cents, total_price_cents, cleaner_marked_complete_at, client_marked_complete_at, paid_out_at, stripe_transfer_id, client:profiles!bookings_client_id_fkey ( full_name )" as const;

function formatBookingDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPayoutDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function clientName(booking: CleanerEarningsBooking): string {
  return booking.client?.full_name?.trim() || "Client";
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`border shadow-sm ${
        highlight ? "border-primary/30 bg-accent/40" : "border-border"
      }`}
    >
      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <Icon
            className={`size-4 ${
              highlight ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p
          className={`text-2xl font-bold ${
            highlight ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function EarningsBreakdown({
  booking,
}: {
  booking: CleanerEarningsBooking;
}) {
  return (
    <div className="mt-2 grid gap-1 rounded-lg bg-muted/40 p-3 text-xs">
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Client Paid</span>
        <span className="font-medium text-foreground">
          {formatUsdFromCents(booking.total_price_cents)}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Platform Fee</span>
        <span className="font-medium text-foreground">
          {formatUsdFromCents(booking.platform_fee_cents)}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Your Earnings</span>
        <span className="font-semibold text-foreground">
          {formatUsdFromCents(booking.cleaner_payout_cents)}
        </span>
      </div>
    </div>
  );
}

function RecentEarningsRow({ booking }: { booking: CleanerEarningsBooking }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {clientName(booking)}
            </p>
            <Badge variant="outline" className="text-xs">
              {getPayoutStatusLabel(booking.payout_status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBookingDate(booking.scheduled_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-foreground">
            {formatUsdFromCents(booking.cleaner_payout_cents)}
          </p>
          <p className="text-xs text-muted-foreground">your earnings</p>
        </div>
      </div>
      <EarningsBreakdown booking={booking} />
    </div>
  );
}

export default async function CleanerPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const [{ data: earningsBookings }, { data: cleanerProfile }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(earningsSelect)
        .eq("cleaner_id", user.id)
        .eq("payment_status", "paid")
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("cleaner_profiles")
        .select("stripe_account_id, stripe_payouts_enabled")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const bookings = (earningsBookings ?? []) as CleanerEarningsBooking[];
  const summary = computeCleanerEarningsSummary(bookings);
  const recentEarnings = getRecentEarningsBookings(bookings);
  const paidOutBookings = getPaidOutBookings(bookings);
  const showEarnings = hasAnyEarnings(summary);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your earnings and payout history from completed jobs.
          </p>
        </div>

        {cleanerProfile ? (
          <PayoutSetupBanner
            stripeAccountId={cleanerProfile.stripe_account_id}
            stripePayoutsEnabled={cleanerProfile.stripe_payouts_enabled}
          />
        ) : null}

        {!showEarnings ? (
          <DashboardEmptyState
            icon={Wallet}
            title="No earnings yet"
            description="Accept and complete bookings to start earning."
            action={
              <Link
                href="/cleaner/requests"
                className="text-sm font-medium text-primary hover:underline"
              >
                View requests
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Lifetime Earnings"
                value={formatUsdFromCents(summary.lifetimeCents)}
                icon={TrendingUp}
              />
              <SummaryCard
                label="Pending Earnings"
                value={formatUsdFromCents(summary.pendingCents)}
                icon={Clock}
              />
              <SummaryCard
                label="Eligible for Payout"
                value={formatUsdFromCents(summary.eligibleCents)}
                icon={ArrowDownToLine}
                highlight={summary.eligibleCents > 0}
              />
              <SummaryCard
                label="Paid Out"
                value={formatUsdFromCents(summary.paidOutCents)}
                icon={CheckCircle2}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent earnings</CardTitle>
                    <CardDescription>
                      Completed bookings with payment and earnings breakdown.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {recentEarnings.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Completed paid bookings will appear here.
                      </p>
                    ) : (
                      <div className="flex flex-col">
                        {recentEarnings.map((booking, index) => (
                          <div key={booking.id}>
                            {index > 0 ? <Separator className="my-4" /> : null}
                            <RecentEarningsRow booking={booking} />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Payout history</CardTitle>
                    <CardDescription className="text-xs">
                      Transfers released to your connected account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {paidOutBookings.length === 0 ? (
                      <div className="py-8 text-center">
                        <Wallet className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                          Payout history will appear here after completed
                          payouts.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {paidOutBookings.map((booking, index) => (
                          <div key={booking.id}>
                            {index > 0 ? <Separator className="my-3" /> : null}
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {formatPayoutDate(booking.paid_out_at)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {clientName(booking)}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-foreground">
                                  {formatUsdFromCents(
                                    booking.cleaner_payout_cents
                                  )}
                                </p>
                                <Badge variant="secondary" className="mt-0.5 text-xs">
                                  {getPayoutStatusLabel(booking.payout_status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
