"use client";

import { markBookingCompletedAction } from "@/app/client/bookings/actions";

type MarkCompleteFormProps = {
  bookingId: string;
};

export function MarkCompleteForm({ bookingId }: MarkCompleteFormProps) {
  return (
    <form action={markBookingCompletedAction} className="mt-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <button
        type="submit"
        className="rounded-xl border border-[#00695C] bg-white px-4 py-2 text-sm font-semibold text-[#00695C] transition-colors hover:bg-[#00695C]/5"
      >
        Mark as completed
      </button>
    </form>
  );
}
