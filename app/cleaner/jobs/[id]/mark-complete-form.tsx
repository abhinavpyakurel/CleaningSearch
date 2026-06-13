"use client";

import { markJobCompleteAction } from "@/app/cleaner/jobs/[id]/actions";

type MarkJobCompleteFormProps = {
  bookingId: string;
};

export function MarkJobCompleteForm({ bookingId }: MarkJobCompleteFormProps) {
  return (
    <form action={markJobCompleteAction} className="mt-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <button
        type="submit"
        className="rounded-xl border border-[#00695C] bg-white px-4 py-2 text-sm font-semibold text-[#00695C] transition-colors hover:bg-[#00695C]/5"
      >
        Mark job complete
      </button>
    </form>
  );
}
