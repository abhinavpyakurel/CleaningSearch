import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react";

import { CancelBookingForm } from "@/app/client/bookings/cancel-booking-form";
import { CounterResponseForm } from "@/app/client/bookings/counter-response-form";
import { MarkCompleteForm } from "@/app/client/bookings/mark-complete-form";
import { PayNowForm } from "@/app/client/bookings/pay-now-form";
import { ReviewBookingForm } from "@/app/client/bookings/review-booking-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUsdFromCents } from "@/lib/booking-price";
import { getClientCancellationUi } from "@/lib/booking-cancellation";
import { parseCounterAdjustments } from "@/lib/counter-offer";
import {
  getServiceTypeLabel,
  SERVICE_TYPES,
  type ServiceType,
} from "@/lib/intake-estimate";
import type { Json } from "@/lib/database.types";

export type ClientBooking = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  status: string;
  payment_status: string;
  payout_status: string;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  refund_amount_cents: number | null;
  non_refundable_fee_cents: number | null;
  cleaner_payout_cents: number | null;
  platform_fee_cents: number | null;
  cleaner_id: string | null;
  cleaner_name: string | null;
  cleaner_photo_url: string | null;
  service_type: string | null;
  has_review: boolean;
  client_requested_hours: number | null;
  total_price_cents: number | null;
  counter_adjustments: Json | null;
  counter_hours: number | null;
  counter_total_price_cents: number | null;
  counter_reason: string | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for cleaner response",
  countered: "Cleaner suggested changes",
  accepted_pending_payment: "Cleaner accepted — payment required",
  confirmed: "Paid and confirmed",
  in_progress: "In progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
  declined: "Declined",
};

function getStatusLabel(status: string, paymentStatus: string): string {
  if (status === "cancelled" && paymentStatus === "refunded") {
    return "Refunded";
  }

  if (status === "confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed";
  }

  return STATUS_LABELS[status] ?? status;
}

function getStatusBadgeVariant(
  status: string,
  paymentStatus: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "confirmed":
    case "in_progress":
    case "completed":
      if (paymentStatus === "paid") {
        return "default";
      }
      return "secondary";
    case "cancelled":
    case "declined":
    case "disputed":
      return "destructive";
    case "countered":
    case "accepted_pending_payment":
      return "secondary";
    default:
      return "outline";
  }
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

function formatServiceSummary(serviceType: string | null): string | null {
  if (!serviceType?.trim()) {
    return null;
  }

  if (!(SERVICE_TYPES as readonly string[]).includes(serviceType)) {
    return null;
  }

  return getServiceTypeLabel(serviceType as ServiceType);
}

function getCleanerInitial(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return "?";
  }

  return trimmed[0]?.toUpperCase() ?? "?";
}

function PaymentStatusRow({
  booking,
  isPaymentProcessing,
}: {
  booking: ClientBooking;
  isPaymentProcessing: boolean;
}) {
  const isRefunded =
    booking.status === "cancelled" && booking.payment_status === "refunded";

  if (isPaymentProcessing) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Payment processing
        </span>
      </div>
    );
  }

  if (isRefunded) {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Refunded
        </span>
      </div>
    );
  }

  if (booking.payment_status === "paid") {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">Paid</span>
      </div>
    );
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Pending payment
        </span>
      </div>
    );
  }

  return null;
}

type BookingCardProps = {
  booking: ClientBooking;
  isPaymentProcessing: boolean;
};

export function BookingCard({ booking, isPaymentProcessing }: BookingCardProps) {
  const totalPrice = formatUsdFromCents(booking.total_price_cents);
  const counterTotalPrice = formatUsdFromCents(booking.counter_total_price_cents);
  const serviceSummary = formatServiceSummary(booking.service_type);

  const showCleaner =
    booking.cleaner_id != null && booking.cleaner_name != null;
  const cancellationUi = getClientCancellationUi(booking);
  const canConfirmComplete =
    booking.status === "confirmed" &&
    booking.payment_status === "paid" &&
    booking.client_marked_complete_at == null;
  const canReview =
    booking.status === "completed" && !booking.has_review;
  const needsPayment =
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid" &&
    !isPaymentProcessing;
  const servicePrice = formatUsdFromCents(booking.cleaner_payout_cents);
  const platformFee = formatUsdFromCents(booking.platform_fee_cents);
  const counterAdjustments = parseCounterAdjustments(booking.counter_adjustments);
  const originalHours =
    booking.client_requested_hours ?? booking.duration_hours;
  const displayHours =
    booking.status === "countered" ? originalHours : booking.duration_hours;
  const isRefunded =
    booking.status === "cancelled" && booking.payment_status === "refunded";
  const refundedServiceAmount = formatUsdFromCents(
    booking.refund_amount_cents ?? booking.cleaner_payout_cents
  );
  const refundedNonRefundableFee = formatUsdFromCents(
    booking.non_refundable_fee_cents ?? booking.platform_fee_cents
  );
  const displayPrice =
    booking.status === "countered" ? counterTotalPrice : totalPrice;

  const hasActionSection =
    booking.status === "countered" ||
    isPaymentProcessing ||
    needsPayment ||
    canConfirmComplete ||
    (booking.status === "confirmed" &&
      booking.client_marked_complete_at != null &&
      booking.cleaner_marked_complete_at == null) ||
    (cancellationUi.canCancel && cancellationUi.cancelMode != null) ||
    cancellationUi.policyMessage != null ||
    isRefunded ||
    canReview ||
    (booking.status === "completed" && booking.has_review);

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar size="lg" className="size-12 shrink-0">
            {booking.cleaner_photo_url ? (
              <AvatarImage
                src={booking.cleaner_photo_url}
                alt={
                  showCleaner
                    ? `${booking.cleaner_name} profile`
                    : "Cleaner profile"
                }
              />
            ) : null}
            <AvatarFallback className="bg-accent font-bold text-accent-foreground">
              {getCleanerInitial(booking.cleaner_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {showCleaner ? booking.cleaner_name : "Looking for cleaner"}
              </span>
              <Badge
                variant={getStatusBadgeVariant(
                  booking.status,
                  booking.payment_status
                )}
                className="text-xs"
              >
                {getStatusLabel(booking.status, booking.payment_status)}
              </Badge>
            </div>

            {serviceSummary ? (
              <p className="mb-2 text-sm font-medium text-foreground">
                {serviceSummary}
              </p>
            ) : null}

            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" />
                {formatScheduledAt(booking.scheduled_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {formatDuration(displayHours)}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                <span className="break-words">
                  {booking.service_address ?? "No address"}
                </span>
              </span>
            </div>

            {booking.notes ? (
              <p className="mb-3 text-sm italic text-muted-foreground whitespace-pre-wrap">
                {booking.notes}
              </p>
            ) : null}

            <Separator className="mb-3" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <PaymentStatusRow
                booking={booking}
                isPaymentProcessing={isPaymentProcessing}
              />
              <span className="text-sm font-semibold text-foreground">
                {displayPrice}
              </span>
            </div>
          </div>
        </div>

        {hasActionSection ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          {booking.status === "countered" ? (
            <section className="rounded-xl border border-border bg-accent/40 p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Cleaner counter offer
              </h2>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="text-foreground/70">Your requested hours: </span>
                  {formatHoursValue(originalHours)}
                </p>
                <p>
                  <span className="text-foreground/70">Your original price: </span>
                  {formatUsdFromCents(booking.total_price_cents)}
                </p>
                <p>
                  <span className="text-foreground/70">Cleaner requested hours: </span>
                  {formatHoursValue(booking.counter_hours)}
                </p>
                <p>
                  <span className="text-foreground/70">New total price: </span>
                  {formatUsdFromCents(booking.counter_total_price_cents)}
                </p>
              </div>

              {counterAdjustments.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground">
                    What changed
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {counterAdjustments.map((adjustment) => (
                      <li key={`${adjustment.field}-${adjustment.description}`}>
                        {adjustment.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {booking.counter_reason ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground">
                    Cleaner&apos;s counter reason
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {booking.counter_reason}
                  </p>
                </div>
              ) : null}

              <CounterResponseForm bookingId={booking.id} />
            </section>
          ) : null}

          {isPaymentProcessing ? (
            <section className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Payment processing
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Stripe is confirming your payment. This booking will update to
                confirmed shortly — no need to pay again.
              </p>
            </section>
          ) : null}

          {needsPayment ? (
            <section className="rounded-xl border border-border bg-accent/40 p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Cleaner accepted — payment required
              </h2>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <span>Cleaning service</span>
                  <span className="text-foreground">{servicePrice}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>CleanMatch service fee</span>
                  <span className="text-foreground">{platformFee}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold text-foreground">
                  <span>Total due</span>
                  <span>{totalPrice}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                CleanMatch service fee is non-refundable after your booking is
                accepted. Cleaning service refunds are available for eligible
                cancellations more than 24 hours before the scheduled time.
              </p>
              <PayNowForm bookingId={booking.id} />
            </section>
          ) : null}

          {canConfirmComplete ? (
            <MarkCompleteForm bookingId={booking.id} />
          ) : null}

          {booking.status === "confirmed" &&
          booking.client_marked_complete_at != null &&
          booking.cleaner_marked_complete_at == null ? (
            <p className="text-sm text-muted-foreground">
              Completion confirmed. Waiting for cleaner to mark the job complete.
            </p>
          ) : null}

          {cancellationUi.canCancel && cancellationUi.cancelMode ? (
            <CancelBookingForm
              bookingId={booking.id}
              cancelMode={cancellationUi.cancelMode}
              refundBreakdown={cancellationUi.refundBreakdown}
            />
          ) : cancellationUi.policyMessage ? (
            <p className="text-sm text-muted-foreground">
              {cancellationUi.policyMessage}
            </p>
          ) : null}

          {isRefunded ? (
            <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Refunded</p>
              <p>Cleaning service refund: {refundedServiceAmount}</p>
              <p>Non-refundable service fee: {refundedNonRefundableFee}</p>
            </div>
          ) : null}

          {canReview ? <ReviewBookingForm bookingId={booking.id} /> : null}

          {booking.status === "completed" && booking.has_review ? (
            <p className="text-sm text-muted-foreground">
              Review submitted — thank you!
            </p>
          ) : null}
        </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
