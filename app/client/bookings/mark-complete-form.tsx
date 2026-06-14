"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  markBookingCompletedAction,
  type MarkCompleteActionState,
} from "@/app/client/bookings/actions";

const initialState: MarkCompleteActionState = { error: null };

type MarkCompleteFormProps = {
  bookingId: string;
};

function ConfirmCompleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-[#00695C] bg-white px-4 py-2 text-sm font-semibold text-[#00695C] transition-colors hover:bg-[#00695C]/5 disabled:opacity-60"
    >
      {pending ? "Confirming…" : "Confirm job completed"}
    </button>
  );
}

export function MarkCompleteForm({ bookingId }: MarkCompleteFormProps) {
  const [state, formAction] = useFormState(
    markBookingCompletedAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <ConfirmCompleteButton />
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
