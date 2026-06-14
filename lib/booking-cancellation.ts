import { hasCompletionStarted } from "@/lib/booking-completion";

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ClientCancellationBooking = {
  status: string;
  payment_status: string;
  scheduled_at: string | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

export type ClientCancellationUi = {
  canCancel: boolean;
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

export function getClientCancellationUi(
  booking: ClientCancellationBooking
): ClientCancellationUi {
  const completionStarted = hasCompletionStarted(booking);

  if (completionStarted) {
    return {
      canCancel: false,
      policyMessage: "Cannot cancel after completion has started.",
    };
  }

  if (booking.status === "pending") {
    return { canCancel: true, policyMessage: null };
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return { canCancel: true, policyMessage: null };
  }

  if (booking.status === "confirmed") {
    if (booking.payment_status === "paid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
        };
      }

      return {
        canCancel: false,
        policyMessage: "Cancellation after payment requires refund handling.",
      };
    }

    if (booking.payment_status === "unpaid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
        };
      }

      return { canCancel: true, policyMessage: null };
    }
  }

  return { canCancel: false, policyMessage: null };
}
