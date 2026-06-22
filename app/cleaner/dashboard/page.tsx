import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Clock,
  DollarSign,
  Inbox,
  MapPin,
  Wallet,
} from "lucide-react";

import { DashboardEmptyState } from "@/app/cleaner/_components/dashboard-empty-state";
import { CleanerStatsCard } from "@/app/cleaner/dashboard/cleaner-stats-card";
import {
  PayoutSetupBanner,
  PayoutSetupCard,
} from "@/app/cleaner/dashboard/payout-setup-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUsdFromCents } from "@/lib/booking-price";
import { getPayoutStatusLabel } from "@/lib/booking-completion";
import {
  getCleanerStatusBadgeVariant,
  getCleanerStatusLabel,
} from "@/lib/cleaner-booking-labels";
import { DAY_LABELS_SHORT } from "@/lib/cleaner-availability";
import { createClient } from "@/lib/supabase/server";

type JobListing = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  status?: string;
  payment_status?: string;
  payout_status?: string | null;
  cleaner_payout_cents?: number | null;
  cleaner_marked_complete_at?: string | null;
  client_marked_complete_at?: string | null;
  client?: { full_name: string | null } | null;
};

type PendingRequestPreview = {
  id: string;
  scheduled_at: string | null;
  duration_hours: number | null;
  client_requested_hours: number | null;
  cleaner_payout_cents: number | null;
  client: { full_name: string | null } | null;
};

type PayoutRow = {
  cleaner_payout_cents: number | null;
  payout_status: string;
};

function sumPayoutCents(rows: PayoutRow[], status: string): number {
  return rows.reduce((sum, row) => {
    if (row.payout_status !== status) {
      return sum;
    }

    const cents = row.cleaner_payout_cents;
    if (cents == null || !Number.isFinite(cents)) {
      return sum;
    }

    return sum + cents;
  }, 0);
}

function formatScheduledAt(iso: string | null): string {
  if (!iso) {
    return "Not scheduled";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) {
    return "—";
  }

  const label = hours === 1 ? "hour" : "hours";
  return `${hours} ${label}`;
}

function clientInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "C";
}

function clientName(job: JobListing | PendingRequestPreview): string {
  return job.client?.full_name?.trim() || "Client";
}

function AvailabilitySummary({
  availabilityWindows,
  isAcceptingRequests,
}: {
  availabilityWindows: { day_of_week: number }[];
  isAcceptingRequests: boolean;
}) {
  const openDays = new Set(
    availabilityWindows.map((window) => window.day_of_week)
  );
  const openCount = openDays.size;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">Availability this week</CardTitle>
        <Link href="/cleaner/availability">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            Edit
            <ChevronRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-1.5">
          {DAY_LABELS_SHORT.map((day, index) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{day}</span>
              <div
                className={`h-2 w-full rounded-full ${
                  openDays.has(index) ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {openCount === 0
            ? "No days open — add availability on the availability page."
            : `${openCount} of 7 days open`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAcceptingRequests
            ? "Accepting new requests"
            : "Not accepting new requests"}
        </p>
      </CardContent>
    </Card>
  );
}

function JobRow({
  job,
  showCompletionHint,
  awaitingPayment,
}: {
  job: JobListing;
  showCompletionHint?: boolean;
  awaitingPayment?: boolean;
}) {
  const waitingForClient =
    showCompletionHint &&
    job.cleaner_marked_complete_at != null &&
    job.client_marked_complete_at == null;

  const status = job.status ?? "pending";
  const paymentStatus = job.payment_status ?? "unpaid";

  const showPayoutLabel =
    job.status === "completed" &&
    job.payout_status != null &&
    ["ready", "paid", "paused", "locked"].includes(job.payout_status);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {clientInitial(job.client?.full_name)}
        </div>
        <div className="min-w-0">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {clientName(job)}
            </span>
            {awaitingPayment ? (
              <Badge variant="secondary" className="text-xs">
                Awaiting client payment
              </Badge>
            ) : (
              <Badge
                variant={getCleanerStatusBadgeVariant(status, paymentStatus)}
                className="text-xs"
              >
                {getCleanerStatusLabel(status, paymentStatus)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 shrink-0" />
              {formatScheduledAt(job.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              {formatDuration(job.duration_hours)}
            </span>
          </div>
          {job.service_address ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{job.service_address}</span>
            </p>
          ) : null}
          {waitingForClient ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Waiting for client confirmation.
            </p>
          ) : null}
          {showPayoutLabel ? (
            <p className="mt-1 text-xs font-medium text-primary">
              {getPayoutStatusLabel(job.payout_status!)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {job.cleaner_payout_cents != null ? (
          <span className="text-sm font-semibold text-foreground">
            {formatUsdFromCents(job.cleaner_payout_cents)}
          </span>
        ) : null}
        <Link
          href={`/cleaner/jobs/${job.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </div>
  );
}

function OverviewStatCard({
  label,
  value,
  icon: Icon,
  highlight,
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
  sublabel?: string;
}) {
  return (
    <Card
      className={`border shadow-sm ${
        highlight ? "border-primary/30 bg-accent/40" : "border-border"
      }`}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon
            className={`size-4 ${
              highlight ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>
        <p
          className={`text-2xl font-bold ${
            highlight ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </p>
        {sublabel ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function CleanerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select(
      "hourly_rate, service_radius_miles, bio, total_jobs, avg_rating, is_available, stripe_account_id, stripe_payouts_enabled"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: availabilityWindows } = await supabase
    .from("cleaner_availability_windows")
    .select("day_of_week, start_time, end_time")
    .eq("cleaner_id", user.id)
    .order("day_of_week", { ascending: true });

  const jobSelect =
    "id, service_address, scheduled_at, duration_hours, notes, status, payment_status, cleaner_payout_cents, cleaner_marked_complete_at, client_marked_complete_at, client:profiles!bookings_client_id_fkey ( full_name )" as const;

  const completedJobSelect =
    "id, service_address, scheduled_at, duration_hours, notes, status, payment_status, payout_status, cleaner_payout_cents, cleaner_marked_complete_at, client_marked_complete_at, client:profiles!bookings_client_id_fkey ( full_name )" as const;

  const [
    { data: pendingRequests },
    { data: awaitingPaymentJobs },
    { data: confirmedJobs },
    { data: completedJobs },
    { data: availableJobs },
    { data: payoutRows },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, scheduled_at, duration_hours, client_requested_hours, cleaner_payout_cents, client:profiles!bookings_client_id_fkey ( full_name )"
      )
      .eq("cleaner_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("bookings")
      .select(jobSelect)
      .eq("cleaner_id", user.id)
      .eq("status", "accepted_pending_payment")
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(jobSelect)
      .eq("cleaner_id", user.id)
      .eq("status", "confirmed")
      .eq("payment_status", "paid")
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(completedJobSelect)
      .eq("cleaner_id", user.id)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        "id, service_address, scheduled_at, duration_hours, notes, cleaner_marked_complete_at, client_marked_complete_at"
      )
      .eq("status", "pending")
      .is("cleaner_id", null)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("cleaner_payout_cents, payout_status")
      .eq("cleaner_id", user.id)
      .eq("status", "completed"),
  ]);

  const { count: pendingRequestsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("cleaner_id", user.id)
    .eq("status", "pending");

  const upcomingCount = confirmedJobs?.length ?? 0;
  const completedCount = completedJobs?.length ?? 0;
  const payoutData = (payoutRows ?? []) as PayoutRow[];
  const readyPayoutCents = sumPayoutCents(payoutData, "ready");
  const paidOutCents = sumPayoutCents(payoutData, "paid");
  const lockedPayoutCents = sumPayoutCents(payoutData, "locked");

  const welcomeName = profile.full_name ?? user.email ?? "there";
  const pendingTotal = pendingRequestsCount ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {welcomeName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s on your plate today.
          </p>
        </div>

        {cleanerProfile ? (
          <PayoutSetupBanner
            stripeAccountId={cleanerProfile.stripe_account_id}
            stripePayoutsEnabled={cleanerProfile.stripe_payouts_enabled}
          />
        ) : null}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <OverviewStatCard
            label="New requests"
            value={String(pendingTotal)}
            icon={Inbox}
            highlight={pendingTotal > 0}
          />
          <OverviewStatCard
            label="Upcoming jobs"
            value={String(upcomingCount)}
            icon={CalendarCheck}
          />
          <OverviewStatCard
            label="Completed jobs"
            value={String(completedCount)}
            icon={Briefcase}
          />
          <OverviewStatCard
            label="Ready for payout"
            value={formatUsdFromCents(readyPayoutCents)}
            icon={DollarSign}
            sublabel={
              lockedPayoutCents > 0
                ? `Processing: ${formatUsdFromCents(lockedPayoutCents)}`
                : paidOutCents > 0
                  ? `Paid out: ${formatUsdFromCents(paidOutCents)}`
                  : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Requests needing response</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    {pendingTotal === 0
                      ? "No new requests right now"
                      : `${pendingTotal} request${pendingTotal === 1 ? "" : "s"} waiting`}
                  </CardDescription>
                </div>
                {pendingTotal > 0 ? (
                  <Link href="/cleaner/requests">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      View all
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </Link>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0">
                {pendingTotal === 0 ? (
                  <DashboardEmptyState
                    icon={Inbox}
                    title="No new requests"
                    description="When clients request you directly, they'll appear here."
                    action={
                      <Link href="/cleaner/requests">
                        <Button variant="outline" size="sm">
                          Go to requests
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="flex flex-col">
                    {(pendingRequests as PendingRequestPreview[]).map(
                      (request, index) => (
                        <div key={request.id}>
                          {index > 0 ? <Separator className="my-3" /> : null}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                                {clientInitial(request.client?.full_name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {clientName(request)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatScheduledAt(request.scheduled_at)} ·{" "}
                                  {formatDuration(
                                    request.client_requested_hours ??
                                      request.duration_hours
                                  )}
                                </p>
                              </div>
                            </div>
                            {request.cleaner_payout_cents != null ? (
                              <span className="text-sm font-semibold text-foreground">
                                {formatUsdFromCents(request.cleaner_payout_cents)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    )}
                    <Link href="/cleaner/requests" className="mt-4 block">
                      <Button className="w-full gap-1.5" size="sm">
                        Review requests
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Upcoming jobs</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    Paid and confirmed bookings on your schedule
                  </CardDescription>
                </div>
                {confirmedJobs?.length ? (
                  <Link href="/cleaner/jobs">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      View all
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </Link>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0">
                {!confirmedJobs?.length ? (
                  <DashboardEmptyState
                    icon={CalendarCheck}
                    title="No upcoming jobs"
                    description="Confirmed bookings will show here once clients pay."
                  />
                ) : (
                  <div className="flex flex-col">
                    {(confirmedJobs as JobListing[]).map((job, index) => (
                      <div key={job.id}>
                        {index > 0 ? <Separator className="my-3" /> : null}
                        <JobRow job={job} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {!awaitingPaymentJobs?.length ? null : (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Awaiting client payment</CardTitle>
                  <CardDescription className="text-xs">
                    Accepted bookings waiting for client checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col">
                    {(awaitingPaymentJobs as JobListing[]).map((job, index) => (
                      <div key={job.id}>
                        {index > 0 ? <Separator className="my-3" /> : null}
                        <JobRow job={job} awaitingPayment />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Completed jobs</CardTitle>
                <CardDescription className="text-xs">
                  Jobs both sides have marked complete
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {!completedJobs?.length ? (
                  <DashboardEmptyState
                    icon={Briefcase}
                    title="No completed jobs yet"
                    description="Finished jobs and payout status will appear here."
                  />
                ) : (
                  <div className="flex flex-col">
                    {(completedJobs as JobListing[]).slice(0, 5).map((job, index) => (
                      <div key={job.id}>
                        {index > 0 ? <Separator className="my-3" /> : null}
                        <JobRow job={job} showCompletionHint />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {pendingTotal > 0 ? (
              <Card className="border border-primary/20 bg-accent/20 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Inbox className="size-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {pendingTotal} new request{pendingTotal === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Respond to keep clients moving toward checkout.
                  </p>
                  <Link href="/cleaner/requests">
                    <Button size="sm" className="w-full gap-1.5">
                      Review requests
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            {cleanerProfile ? (
              <>
                <PayoutSetupCard
                  stripeAccountId={cleanerProfile.stripe_account_id}
                  stripePayoutsEnabled={cleanerProfile.stripe_payouts_enabled}
                  readyPayoutCents={readyPayoutCents}
                  paidOutCents={paidOutCents}
                  lockedPayoutCents={lockedPayoutCents}
                />

                {(readyPayoutCents > 0 || paidOutCents > 0) ? (
                  <Card className="border border-border shadow-sm">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="size-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">
                            Earnings summary
                          </span>
                        </div>
                        <Link
                          href="/cleaner/payouts"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View payouts
                        </Link>
                      </div>
                      {readyPayoutCents > 0 ? (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground">
                            Ready for payout
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {formatUsdFromCents(readyPayoutCents)}
                          </p>
                        </div>
                      ) : null}
                      {paidOutCents > 0 ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Paid out</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatUsdFromCents(paidOutCents)}
                          </p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                <AvailabilitySummary
                  availabilityWindows={availabilityWindows ?? []}
                  isAcceptingRequests={cleanerProfile.is_available}
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-10">
          {!cleanerProfile ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">
                Complete your cleaner profile
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your rates and service area to start receiving jobs.
              </p>
              <Link href="/cleaner/onboarding" className="mt-4 inline-block">
                <Button>Finish onboarding</Button>
              </Link>
            </div>
          ) : (
            <CleanerStatsCard
              hourlyRate={cleanerProfile.hourly_rate}
              serviceRadiusMiles={cleanerProfile.service_radius_miles}
              bio={cleanerProfile.bio}
              totalJobs={cleanerProfile.total_jobs}
              avgRating={cleanerProfile.avg_rating}
            />
          )}
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Open job pool
          </h2>
          {!availableJobs?.length ? (
            <DashboardEmptyState
              icon={Briefcase}
              title="No open jobs"
              description="Unassigned bookings in your area will appear here."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {availableJobs.map((job) => (
                <Card key={job.id} className="border border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <p>
                        <span className="text-foreground">Address: </span>
                        {job.service_address ?? "—"}
                      </p>
                      <p>
                        <span className="text-foreground">When: </span>
                        {formatScheduledAt(job.scheduled_at)}
                      </p>
                      <p>
                        <span className="text-foreground">Duration: </span>
                        {formatDuration(job.duration_hours)}
                      </p>
                      {job.notes ? (
                        <p>
                          <span className="text-foreground">Notes: </span>
                          <span className="whitespace-pre-wrap">{job.notes}</span>
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/cleaner/jobs/${job.id}`}
                      className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      View job details
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
