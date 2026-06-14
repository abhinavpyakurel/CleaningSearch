"use client";

import { useFormState, useFormStatus } from "react-dom";

import { simulatePaymentSuccessAction } from "@/app/client/bookings/actions";

type PaymentFormState = { error: string | null };

const initialState: PaymentFormState = { error: null };

type SimulatePaymentFormProps = {
  bookingId: string;
};

function PayButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] disabled:opacity-60"
    >
      {pending ? "Processing…" : "Simulate payment success"}
    </button>
  );
}

export function SimulatePaymentForm({ bookingId }: SimulatePaymentFormProps) {
  const [state, formAction] = useFormState(
    async (_prev: PaymentFormState, formData: FormData) =>
      simulatePaymentSuccessAction(formData),
    initialState
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <PayButton />
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
