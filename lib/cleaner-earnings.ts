import { hasCompletionStarted } from "@/lib/booking-completion";

export type CleanerEarningsBooking = {
  id: string;
  scheduled_at: string | null;
  status: string;
  payment_status: string;
  payout_status: string;
  cleaner_payout_cents: number | null;
  platform_fee_cents: number | null;
  total_price_cents: number | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
  paid_out_at: string | null;
  stripe_transfer_id: string | null;
  client?: { full_name: string | null } | null;
};

export type CleanerEarningsSummary = {
  lifetimeCents: number;
  pendingCents: number;
  eligibleCents: number;
  paidOutCents: number;
};

function validCents(cents: number | null): cents is number {
  return cents != null && Number.isFinite(cents) && cents > 0;
}

export function sumCleanerPayoutCents(
  bookings: { cleaner_payout_cents: number | null }[]
): number {
  return bookings.reduce((sum, booking) => {
    const cents = booking.cleaner_payout_cents;
    if (!validCents(cents)) {
      return sum;
    }

    return sum + cents;
  }, 0);
}

export function isPendingEarningsBooking(
  booking: Pick<
    CleanerEarningsBooking,
    | "payment_status"
    | "status"
    | "payout_status"
    | "cleaner_marked_complete_at"
    | "client_marked_complete_at"
  >
): boolean {
  if (booking.payment_status !== "paid") {
    return false;
  }

  if (["cancelled", "declined", "disputed"].includes(booking.status)) {
    return false;
  }

  if (booking.payout_status === "ready" || booking.payout_status === "paid") {
    return false;
  }

  if (booking.status === "completed") {
    return (
      booking.payout_status === "locked" || booking.payout_status === "paused"
    );
  }

  if (booking.status === "confirmed" || booking.status === "in_progress") {
    return (
      hasCompletionStarted(booking) &&
      (booking.payout_status === "locked" || booking.payout_status === "paused")
    );
  }

  return false;
}

export function isLifetimeEarningsBooking(
  booking: Pick<CleanerEarningsBooking, "status" | "payment_status">
): boolean {
  return booking.status === "completed" && booking.payment_status === "paid";
}

export function computeCleanerEarningsSummary(
  bookings: CleanerEarningsBooking[]
): CleanerEarningsSummary {
  let lifetimeCents = 0;
  let pendingCents = 0;
  let eligibleCents = 0;
  let paidOutCents = 0;

  for (const booking of bookings) {
    const cents = booking.cleaner_payout_cents;
    if (!validCents(cents)) {
      continue;
    }

    if (isLifetimeEarningsBooking(booking)) {
      lifetimeCents += cents;
    }

    if (isPendingEarningsBooking(booking)) {
      pendingCents += cents;
    }

    if (booking.payout_status === "ready") {
      eligibleCents += cents;
    }

    if (booking.payout_status === "paid") {
      paidOutCents += cents;
    }
  }

  return { lifetimeCents, pendingCents, eligibleCents, paidOutCents };
}

export function getPaidOutBookings(
  bookings: CleanerEarningsBooking[]
): CleanerEarningsBooking[] {
  return bookings
    .filter((booking) => booking.payout_status === "paid")
    .sort((a, b) => {
      const aTime = a.paid_out_at ? new Date(a.paid_out_at).getTime() : 0;
      const bTime = b.paid_out_at ? new Date(b.paid_out_at).getTime() : 0;
      return bTime - aTime;
    });
}

export function getRecentEarningsBookings(
  bookings: CleanerEarningsBooking[]
): CleanerEarningsBooking[] {
  return bookings
    .filter(isLifetimeEarningsBooking)
    .sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return bTime - aTime;
    });
}

export function hasAnyEarnings(summary: CleanerEarningsSummary): boolean {
  return (
    summary.lifetimeCents > 0 ||
    summary.pendingCents > 0 ||
    summary.eligibleCents > 0 ||
    summary.paidOutCents > 0
  );
}
