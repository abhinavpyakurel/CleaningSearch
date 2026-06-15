"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  cancelBookingAction,
  type CancelBookingState,
} from "@/app/client/bookings/actions";
import { formatUsdFromCents } from "@/lib/booking-price";
import type { RefundBreakdown } from "@/lib/booking-cancellation";

const initialState: CancelBookingState = { error: null };

type CancelBookingFormProps = {
  bookingId: string;
  cancelMode: "simple" | "refund";
  refundBreakdown?: RefundBreakdown | null;
};

function CancelButton({ cancelMode }: { cancelMode: "simple" | "refund" }) {
  const { pending } = useFormStatus();
  const label =
    cancelMode === "refund"
      ? "Cancel booking and refund service amount"
      : "Cancel booking";
  const pendingLabel =
    cancelMode === "refund"
      ? "Cancelling and refunding service amount…"
      : "Cancelling…";

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function RefundBreakdownDetails({
  refundBreakdown,
}: {
  refundBreakdown: RefundBreakdown;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
      <div className="flex justify-between gap-4">
        <span>Cleaning service refund</span>
        <span className="font-medium text-gray-900">
          {formatUsdFromCents(refundBreakdown.serviceRefundCents)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Non-refundable CleanMatch service fee</span>
        <span className="font-medium text-gray-900">
          {formatUsdFromCents(refundBreakdown.nonRefundableFeeCents)}
        </span>
      </div>
      <div className="flex justify-between gap-4 border-t border-gray-200 pt-2">
        <span>Total originally paid</span>
        <span className="font-semibold text-gray-900">
          {formatUsdFromCents(refundBreakdown.totalPaidCents)}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        The CleanMatch service fee is non-refundable after your booking is
        accepted.
      </p>
    </div>
  );
}

export function CancelBookingForm({
  bookingId,
  cancelMode,
  refundBreakdown = null,
}: CancelBookingFormProps) {
  const [state, formAction] = useFormState(cancelBookingAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      {cancelMode === "refund" && refundBreakdown ? (
        <RefundBreakdownDetails refundBreakdown={refundBreakdown} />
      ) : null}
      <CancelButton cancelMode={cancelMode} />
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
