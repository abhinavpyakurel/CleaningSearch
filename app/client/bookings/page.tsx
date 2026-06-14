import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Clock, User } from "lucide-react";

import { CancelBookingForm } from "@/app/client/bookings/cancel-booking-form";
import { CounterResponseForm } from "@/app/client/bookings/counter-response-form";
import { MarkCompleteForm } from "@/app/client/bookings/mark-complete-form";
import { ReviewBookingForm } from "@/app/client/bookings/review-booking-form";
import { SimulatePaymentForm } from "@/app/client/bookings/simulate-payment-form";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { formatUsdFromCents } from "@/lib/booking-price";
import { hasCompletionStarted } from "@/lib/booking-completion";
import { parseCounterAdjustments } from "@/lib/counter-offer";
import type { Json } from "@/lib/database.types";

type ClientBooking = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  status: string;
  payment_status: string;
  cleaner_payout_cents: number | null;
  platform_fee_cents: number | null;
  cleaner_id: string | null;
  cleaner_name: string | null;
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
  if (status === "confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed";
  }

  return STATUS_LABELS[status] ?? status;
}

function getStatusBadgeClasses(status: string, paymentStatus: string): string {
  const base =
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold";

  switch (status) {
    case "pending":
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    case "countered":
      return `${base} border-blue-200 bg-blue-50 text-blue-700`;
    case "accepted_pending_payment":
      return `${base} border-orange-200 bg-orange-50 text-orange-700`;
    case "confirmed":
    case "in_progress":
      if (paymentStatus === "paid") {
        return `${base} border-green-200 bg-green-50 text-green-700`;
      }
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    case "completed":
      return `${base} border-green-200 bg-green-50 text-green-700`;
    case "cancelled":
    case "declined":
    case "disputed":
      return `${base} border-red-200 bg-red-50 text-red-600`;
    default:
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
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

function BookingCard({ booking }: { booking: ClientBooking }) {
  const totalPrice = formatUsdFromCents(booking.total_price_cents);
  const counterTotalPrice = formatUsdFromCents(booking.counter_total_price_cents);

  const showCleaner =
    booking.cleaner_id != null && booking.cleaner_name != null;
  const completionStarted = hasCompletionStarted(booking);
  const canConfirmComplete =
    booking.status === "confirmed" &&
    booking.payment_status === "paid" &&
    booking.client_marked_complete_at == null;
  const canReview =
    booking.status === "completed" && !booking.has_review;
  const canCancel =
    booking.status === "pending" ||
    (booking.status === "accepted_pending_payment" &&
      booking.payment_status === "unpaid") ||
    (booking.status === "confirmed" && !completionStarted);
  const cancelDisabled =
    booking.status === "confirmed" && completionStarted;
  const needsPayment =
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid";
  const servicePrice = formatUsdFromCents(booking.cleaner_payout_cents);
  const platformFee = formatUsdFromCents(booking.platform_fee_cents);
  const counterAdjustments = parseCounterAdjustments(booking.counter_adjustments);
  const originalHours =
    booking.client_requested_hours ?? booking.duration_hours;
  const displayHours =
    booking.status === "countered" ? originalHours : booking.duration_hours;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 text-lg font-bold text-gray-900">
          {booking.service_address ?? "No address"}
        </p>
        <span className={getStatusBadgeClasses(booking.status, booking.payment_status)}>
          {getStatusLabel(booking.status, booking.payment_status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <span className="min-w-0 truncate">
            {showCleaner
              ? `Cleaner: ${booking.cleaner_name}`
              : "Looking for cleaner"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <span className="min-w-0">
            {formatScheduledAt(booking.scheduled_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <span>{formatDuration(displayHours)}</span>
        </div>
        <div>
          {booking.status === "countered" ? 
            <span className="text-gray-800 text-sm font-bold">
              Requested Total Price: {counterTotalPrice}
            </span>
           :
           <span className="text-gray-800 font-bold">{totalPrice} </span>
           }     
        </div>
      </div>

      {booking.notes ? (
        <p className="mt-3 text-sm italic text-gray-400 whitespace-pre-wrap">
          {booking.notes}
        </p>
      ) : null}

      {booking.status === "countered" ? (
        <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Cleaner counter offer
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <p>
              <span className="text-gray-500">Your requested hours: </span>
              {formatHoursValue(originalHours)}
            </p>
            <p>
              <span className="text-gray-500">Your original price: </span>
              {formatUsdFromCents(booking.total_price_cents)}
            </p>
            <p>
              <span className="text-gray-500">Cleaner requested hours: </span>
              {formatHoursValue(booking.counter_hours)}
            </p>
            <p>
              <span className="text-gray-500">New total price: </span>
              {formatUsdFromCents(booking.counter_total_price_cents)}
            </p>
          </div>

          {counterAdjustments.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">What changed</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
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
              <p className="text-sm font-medium text-gray-900">
                Cleaner&apos;s counter reason
              </p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {booking.counter_reason}
              </p>
            </div>
          ) : null}

          <CounterResponseForm bookingId={booking.id} />
        </section>
      ) : null}

      {needsPayment ? (
        <section className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Cleaner accepted. Pay now to confirm your booking.
          </h2>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span>Cleaning service</span>
              <span>{servicePrice}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>CleanMatch service fee</span>
              <span>{platformFee}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-orange-100 pt-2 font-semibold text-gray-900">
              <span>Total due</span>
              <span>{totalPrice}</span>
            </div>
          </div>
          <SimulatePaymentForm bookingId={booking.id} />
        </section>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {booking.status === "confirmed" && booking.payment_status === "paid" ? (
          <p className="text-sm font-medium text-green-700">Paid and confirmed</p>
        ) : null}

        {canConfirmComplete ? <MarkCompleteForm bookingId={booking.id} /> : null}

        {booking.status === "confirmed" &&
        booking.client_marked_complete_at != null &&
        booking.cleaner_marked_complete_at == null ? (
          <p className="text-sm text-gray-600">
            Completion confirmed. Waiting for cleaner to mark the job complete.
          </p>
        ) : null}

        {canCancel ? (
          <CancelBookingForm bookingId={booking.id} />
        ) : cancelDisabled ? (
          <CancelBookingForm
            bookingId={booking.id}
            disabled
            disabledReason="Cannot cancel after completion has been started."
          />
        ) : null}

        {canReview ? <ReviewBookingForm bookingId={booking.id} /> : null}

        {booking.status === "completed" && booking.has_review ? (
          <p className="text-sm text-gray-500">
            Review submitted — thank you!
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default async function BookingsPage() {
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

  if (!profile || profile.role !== "client") {
    redirect("/cleaner/dashboard");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, service_address, scheduled_at, duration_hours, notes, status, payment_status, cleaner_id, client_requested_hours, total_price_cents, cleaner_payout_cents, platform_fee_cents, counter_adjustments, counter_hours, counter_total_price_cents, counter_reason, cleaner_marked_complete_at, client_marked_complete_at"
    )
    .eq("client_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = bookings ?? [];
  const bookingIds = rows.map((b) => b.id);

  const reviewedBookingIds = new Set<string>();

  if (bookingIds.length > 0) {
    const { data: clientReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("reviewer_id", user.id)
      .in("booking_id", bookingIds);

    if (reviewsError) {
      throw new Error(reviewsError.message);
    }

    for (const review of clientReviews ?? []) {
      reviewedBookingIds.add(review.booking_id);
    }
  }

  const cleanerIds = [
    ...new Set(
      rows
        .map((b) => b.cleaner_id)
        .filter((id): id is string => id != null)
    ),
  ];

  const cleanerNameById = new Map<string, string>();

  if (cleanerIds.length > 0) {
    const { data: cleanerProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", cleanerIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    for (const profileRow of cleanerProfiles ?? []) {
      const name = profileRow.full_name?.trim();
      if (name) {
        cleanerNameById.set(profileRow.id, name);
      }
    }
  }

  const list: ClientBooking[] = rows.map((booking) => {
    const cleanerName =
      booking.cleaner_id != null
        ? cleanerNameById.get(booking.cleaner_id) ?? null
        : null;

    return {
      ...booking,
      cleaner_name:
        booking.cleaner_id != null && cleanerName ? cleanerName : null,
      has_review: reviewedBookingIds.has(booking.id),
    };
  });

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen w-full bg-[#F5F5F0]">
        <header className="mx-auto max-w-4xl px-6 pb-6 pt-12">
          <h1 className="text-4xl font-bold text-gray-900">My bookings</h1>
          <p className="mt-1 text-base text-gray-500">
            Your scheduled and past cleanings
          </p>
        </header>

        {list.length === 0 ? (
          <section className="mx-auto max-w-4xl px-6 py-24 text-center">
            <p className="text-xl font-semibold text-gray-700">
              No bookings yet.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Find a cleaner to get started.
            </p>
            <Link
              href="/client/cleaners"
              className="mt-6 inline-block rounded-xl bg-[#00695C] px-6 py-3 font-semibold text-white transition-all hover:bg-[#004D40]"
            >
              Find a cleaner
            </Link>
          </section>
        ) : (
          <ul className="mx-auto max-w-4xl space-y-4 px-6 pb-16">
            {list.map((booking) => (
              <li key={booking.id}>
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
