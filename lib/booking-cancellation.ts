import { hasCompletionStarted } from "@/lib/booking-completion";

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ClientCancellationBooking = {
  status: string;
  payment_status: string;
  payout_status: string;
  scheduled_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  cleaner_payout_cents: number | null;
  platform_fee_cents: number | null;
  total_price_cents: number | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

export type RefundBreakdown = {
  serviceRefundCents: number;
  nonRefundableFeeCents: number;
  totalPaidCents: number;
};

export type ClientCancellationUi = {
  canCancel: boolean;
  cancelMode: "simple" | "refund" | null;
  policyMessage: string | null;
  refundBreakdown: RefundBreakdown | null;
};

function hasValidServiceRefundAmount(cleanerPayoutCents: number | null): boolean {
  return (
    cleanerPayoutCents != null &&
    Number.isFinite(cleanerPayoutCents) &&
    cleanerPayoutCents > 0
  );
}

export function getRefundBreakdown(
  booking: Pick<
    ClientCancellationBooking,
    "cleaner_payout_cents" | "platform_fee_cents" | "total_price_cents"
  >
): RefundBreakdown | null {
  if (!hasValidServiceRefundAmount(booking.cleaner_payout_cents)) {
    return null;
  }

  const serviceRefundCents = booking.cleaner_payout_cents!;
  const nonRefundableFeeCents = booking.platform_fee_cents ?? 0;
  const totalPaidCents =
    booking.total_price_cents ?? serviceRefundCents + nonRefundableFeeCents;

  return {
    serviceRefundCents,
    nonRefundableFeeCents,
    totalPaidCents,
  };
}

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
      refundBreakdown: null,
    };
  }

  if (completionStarted) {
    return {
      canCancel: false,
      cancelMode: null,
      policyMessage: "Cannot cancel after completion has started.",
      refundBreakdown: null,
    };
  }

  if (booking.status === "pending") {
    return {
      canCancel: true,
      cancelMode: "simple",
      policyMessage: null,
      refundBreakdown: null,
    };
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return {
      canCancel: true,
      cancelMode: "simple",
      policyMessage: null,
      refundBreakdown: null,
    };
  }

  if (booking.status === "confirmed") {
    if (booking.payment_status === "paid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          cancelMode: null,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
          refundBreakdown: null,
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
          refundBreakdown: null,
        };
      }

      if (
        booking.payout_status === "locked" &&
        booking.stripe_payment_intent_id != null &&
        isMoreThan24HoursBeforeScheduled(booking.scheduled_at)
      ) {
        if (!hasValidServiceRefundAmount(booking.cleaner_payout_cents)) {
          return {
            canCancel: false,
            cancelMode: null,
            policyMessage:
              "This booking cannot be refunded right now. Please contact support.",
            refundBreakdown: null,
          };
        }

        return {
          canCancel: true,
          cancelMode: "refund",
          policyMessage: null,
          refundBreakdown: getRefundBreakdown(booking),
        };
      }

      return {
        canCancel: false,
        cancelMode: null,
        policyMessage: null,
        refundBreakdown: null,
      };
    }

    if (booking.payment_status === "unpaid") {
      if (isWithinCancellationWindow(booking.scheduled_at)) {
        return {
          canCancel: false,
          cancelMode: null,
          policyMessage:
            "Cancellation is unavailable within 24 hours of the scheduled time.",
          refundBreakdown: null,
        };
      }

      return {
        canCancel: true,
        cancelMode: "simple",
        policyMessage: null,
        refundBreakdown: null,
      };
    }
  }

  return {
    canCancel: false,
    cancelMode: null,
    policyMessage: null,
    refundBreakdown: null,
  };
}
