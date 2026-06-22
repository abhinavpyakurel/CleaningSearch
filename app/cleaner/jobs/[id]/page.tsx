import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Wallet,
} from "lucide-react";

import { BookingPhotoGallery } from "@/app/cleaner/requests/booking-photo-gallery";
import { MarkJobCompleteForm } from "@/app/cleaner/jobs/[id]/mark-complete-form";
import { ReleasePayoutForm } from "@/app/cleaner/jobs/[id]/release-payout-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPayoutStatusLabel } from "@/lib/booking-completion";
import {
  createSignedBookingPhotoUrls,
  type BookingPhotoSignedUrl,
} from "@/lib/booking-photos";
import {
  formatHourlyRate,
  formatUsdFromCents,
} from "@/lib/booking-price";
import {
  getCleanerStatusBadgeVariant,
  getCleanerStatusLabel,
} from "@/lib/cleaner-booking-labels";
import { getSelectedAreaLabels, parseScopeSnapshot } from "@/lib/counter-offer";
import { getServiceTypeLabel } from "@/lib/intake-estimate";
import { createClient } from "@/lib/supabase/server";

type JobPageProps = {
  params: { id: string };
};

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
    year: "numeric",
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

function formatHoursValue(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) {
    return "—";
  }

  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function getPaymentStatusLabel(paymentStatus: string): string {
  switch (paymentStatus) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "unpaid":
      return "Unpaid";
    default:
      return paymentStatus;
  }
}

function getHeaderStatusLabel(
  status: string,
  paymentStatus: string,
  payoutStatus: string | null
): string {
  if (status === "completed" && payoutStatus != null) {
    if (
      payoutStatus === "ready" ||
      payoutStatus === "paid" ||
      payoutStatus === "paused" ||
      payoutStatus === "locked"
    ) {
      return getPayoutStatusLabel(payoutStatus);
    }
  }

  if (payoutStatus === "paused") {
    return getPayoutStatusLabel(payoutStatus);
  }

  return getCleanerStatusLabel(status, paymentStatus);
}

export default async function JobPage({ params }: JobPageProps) {
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

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      service_address,
      scheduled_at,
      duration_hours,
      client_requested_hours,
      recommended_hours,
      notes,
      status,
      payment_status,
      cleaner_marked_complete_at,
      client_marked_complete_at,
      payout_status,
      cleaner_payout_cents,
      total_price_cents,
      hourly_rate_snapshot,
      scope_snapshot,
      stripe_transfer_id,
      paid_out_at,
      client:profiles!bookings_client_id_fkey ( full_name ),
      booking_photos ( id, storage_path )
    `
    )
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!booking) {
    notFound();
  }

  const {
    booking_photos: photoRowsRaw,
    client: clientProfile,
    ...bookingData
  } = booking as typeof booking & {
    booking_photos: { id: string; storage_path: string }[] | null;
    client: { full_name: string | null } | null;
  };

  const photoRows = photoRowsRaw ?? [];
  const photos: BookingPhotoSignedUrl[] = await createSignedBookingPhotoUrls(
    supabase,
    photoRows
  );

  const clientName = clientProfile?.full_name?.trim() || "Client";
  const scope = parseScopeSnapshot(bookingData.scope_snapshot);
  const estimatedHours =
    bookingData.client_requested_hours ?? bookingData.duration_hours;

  const isCancelled =
    bookingData.status === "cancelled" ||
    bookingData.status === "disputed" ||
    bookingData.payment_status === "refunded";

  const isAwaitingPayment =
    bookingData.status === "accepted_pending_payment" &&
    bookingData.payment_status === "unpaid";
  const isPaidAndConfirmed =
    bookingData.status === "confirmed" && bookingData.payment_status === "paid";

  const canMarkComplete =
    isPaidAndConfirmed && bookingData.cleaner_marked_complete_at == null;
  const waitingForClient =
    isPaidAndConfirmed &&
    bookingData.cleaner_marked_complete_at != null &&
    bookingData.client_marked_complete_at == null;
  const bothCompleted =
    bookingData.status === "completed" ||
    (bookingData.cleaner_marked_complete_at != null &&
      bookingData.client_marked_complete_at != null);

  const isPayoutReady =
    bookingData.status === "completed" && bookingData.payout_status === "ready";
  const isPayoutPaid = bookingData.payout_status === "paid";
  const isPayoutPaused = bookingData.payout_status === "paused";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/cleaner/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to jobs
        </Link>

        <header className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
            <Badge
              variant={getCleanerStatusBadgeVariant(
                bookingData.status,
                bookingData.payment_status
              )}
              className="text-xs"
            >
              {getHeaderStatusLabel(
                bookingData.status,
                bookingData.payment_status,
                bookingData.payout_status
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Job details</p>
        </header>

        <div className="flex flex-col gap-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Address
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {bookingData.service_address ?? "No address"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Scheduled
                  </p>
                  <p className="mt-1 text-foreground">
                    {formatScheduledAt(bookingData.scheduled_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Duration
                  </p>
                  <p className="mt-1 text-foreground">
                    {formatDuration(estimatedHours)}
                  </p>
                </div>
              </div>

              {bookingData.cleaner_payout_cents != null ? (
                <div className="flex items-start gap-2">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Your payout
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatUsdFromCents(bookingData.cleaner_payout_cents)}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {bookingData.notes ? (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Client notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {bookingData.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Scope and rooms</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {scope ? (
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Home className="size-3.5 shrink-0" />
                    Scope summary
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {getServiceTypeLabel(scope.input.service_type)}
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {getSelectedAreaLabels(scope.input).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <p>
                      Recommended:{" "}
                      {formatHoursValue(
                        bookingData.recommended_hours ??
                          scope.quote.recommended_hours
                      )}{" "}
                      hrs
                    </p>
                    <p>
                      Client total:{" "}
                      {formatUsdFromCents(bookingData.total_price_cents)}
                    </p>
                    <p>
                      Rate: {formatHourlyRate(bookingData.hourly_rate_snapshot)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(bookingData.duration_hours)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <BookingPhotoGallery photos={photos} />
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment and payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  Payment: {getPaymentStatusLabel(bookingData.payment_status)}
                </Badge>
                {bookingData.payout_status ? (
                  <Badge variant="outline" className="text-xs">
                    Payout: {getPayoutStatusLabel(bookingData.payout_status)}
                  </Badge>
                ) : null}
              </div>

              {isCancelled ? (
                <div className="space-y-1">
                  <p className="font-semibold text-destructive">Cancelled</p>
                  <p className="text-muted-foreground">
                    No cleaner payout is due because the booking was cancelled
                    before completion.
                  </p>
                </div>
              ) : null}

              {isAwaitingPayment ? (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Awaiting client payment
                  </p>
                  <p className="text-muted-foreground">
                    This booking is not confirmed until the client pays.
                  </p>
                </div>
              ) : null}

              {isPaidAndConfirmed && !bothCompleted ? (
                <p className="text-muted-foreground">
                  Payout locked until completion is confirmed.
                </p>
              ) : null}

              {isPayoutReady ? (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    {getPayoutStatusLabel("ready")}
                  </p>
                  {bookingData.cleaner_payout_cents != null ? (
                    <p className="text-muted-foreground">
                      Your payout:{" "}
                      {formatUsdFromCents(bookingData.cleaner_payout_cents)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isPayoutPaid ? (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {getPayoutStatusLabel("paid")}
                  </p>
                  <p className="text-muted-foreground">
                    Paid out to your Stripe account.
                  </p>
                  {bookingData.stripe_transfer_id ? (
                    <p className="text-xs text-muted-foreground">
                      Transfer: {bookingData.stripe_transfer_id}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isPayoutPaused ? (
                <p className="font-semibold text-foreground">
                  {getPayoutStatusLabel("paused")}
                </p>
              ) : null}

              {!isCancelled &&
              !isAwaitingPayment &&
              !isPayoutReady &&
              !isPayoutPaid &&
              !isPayoutPaused &&
              bookingData.status === "completed" ? (
                <p className="text-muted-foreground">
                  Payout status:{" "}
                  {getPayoutStatusLabel(bookingData.payout_status ?? "locked")}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {canMarkComplete ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Mark this job complete once you have finished the cleaning.
                  </p>
                  <MarkJobCompleteForm bookingId={bookingData.id} />
                </div>
              ) : null}

              {waitingForClient ? (
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-muted-foreground">
                    Waiting for client confirmation.
                  </p>
                </div>
              ) : null}

              {bothCompleted ? (
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="font-semibold text-foreground">Job completed</p>
                </div>
              ) : null}

              {!canMarkComplete && !waitingForClient && !bothCompleted ? (
                <p className="text-sm text-muted-foreground">
                  Completion actions appear once the booking is paid and
                  confirmed.
                </p>
              ) : null}

              {isPayoutReady ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Test payout release (development)
                    </p>
                    <ReleasePayoutForm bookingId={bookingData.id} />
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
