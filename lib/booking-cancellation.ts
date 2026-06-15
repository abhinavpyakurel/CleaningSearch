import { hasCompletionStarted } from "@/lib/booking-completion";

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ClientCancellationBooking = {
  status: string;
  payment_status: string;
  payout_status: string;
  scheduled_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

export type ClientCancellationUi = {
  canCancel: boolean;
  cancelMode: "simple" | "refund" | null;
  policyMessage: string | null;
};

function getScheduledTimeMs(scheduledAt: string | null): number | null {
  if (!scheduledAt) {
    return null;
  }

  const scheduledTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) {
    return null;
  }

  return scheduledTime;
}

function isWithinCancellationWindow(scheduledAt: string | null): boolean {
  const scheduledTime = getScheduledTimeMs(scheduledAt);
  if (scheduledTime == null) {
    return true;
  }

  return scheduledTime - Date.now() <= CANCELLATION_WINDOW_MS;
}

function isMoreThan24HoursBeforeScheduled(scheduledAt: string | null): boolean {
  const scheduledTime = getScheduledTimeMs(scheduledAt);
  if (scheduledTime == null) {
    return false;
  }

  return scheduledTime - Date.now() > CANCELLATION_WINDOW_MS;
}

export function getClientCancellationUi(
  booking: ClientCancellationBooking
): ClientCancellationUi {
  const completionStarted = hasCompletionStarted(booking);

  if (
    booking.stripe_refund_id != null ||
    booking.payment_status === "refunded"
  ) {
    return {
      canCancel: false,
      cancelMode: null,
      policyMessage: "This booking has already been refunded.",
    };
  }

  if (completionStarted) {
    return {
      canCancel: false,
      cancelMode: null,
      policyMessage: "Cannot cancel after completion has started.",
    };
  }

  if (booking.status === "pending") {
    return { canCancel: true, cancelMode: "simple", policyMessage: null };
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return { canCancel: true, cancelMode: "simple", policyMessage: null };
  }

  if (booking.status === "confirmed") {
    if (booking.payment_status === "paid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          cancelMode: null,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
        };
      }

      if (
        booking.payout_status === "ready" ||
        booking.payout_status === "paid"
      ) {
        return {
          canCancel: false,
          cancelMode: null,
          policyMessage:
            "This booking can no longer be cancelled because payout processing has started.",
        };
      }

      if (
        booking.payout_status === "locked" &&
        booking.stripe_payment_intent_id != null &&
        isMoreThan24HoursBeforeScheduled(booking.scheduled_at)
      ) {
        return { canCancel: true, cancelMode: "refund", policyMessage: null };
      }

      return { canCancel: false, cancelMode: null, policyMessage: null };
    }

    if (booking.payment_status === "unpaid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          cancelMode: null,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
        };
      }

      return { canCancel: true, cancelMode: "simple", policyMessage: null };
    }
  }

  return { canCancel: false, cancelMode: null, policyMessage: null };
}
