"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  cancelBookingAction,
  type CancelBookingState,
} from "@/app/client/bookings/actions";

const initialState: CancelBookingState = { error: null };

type CancelBookingFormProps = {
  bookingId: string;
};

function CancelButton() {
  const { pending } = useFormStatus();

  return (
    
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Cancelling…" : "Cancel booking"}
    </button>
  );
}

export function CancelBookingForm({ bookingId }: CancelBookingFormProps) {
  const [state, formAction] = useFormState(cancelBookingAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <CancelButton />
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
