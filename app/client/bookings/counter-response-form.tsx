"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  acceptCounterOfferAction,
  declineCounterOfferAction,
  type CounterResponseActionState,
} from "@/app/client/bookings/actions";

const initialState: CounterResponseActionState = { error: null };

type CounterResponseFormProps = {
  bookingId: string;
};

function AcceptButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] disabled:opacity-60"
    >
      {pending ? "Accepting…" : "Accept counter"}
    </button>
  );
}

function DeclineButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Declining…" : "Decline counter"}
    </button>
  );
}

export function CounterResponseForm({ bookingId }: CounterResponseFormProps) {
  const [acceptState, acceptAction] = useFormState(
    acceptCounterOfferAction,
    initialState
  );
  const [declineState, declineAction] = useFormState(
    declineCounterOfferAction,
    initialState
  );

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="booking_id" value={bookingId} />
          <AcceptButton />
        </form>
        <form action={declineAction}>
          <input type="hidden" name="booking_id" value={bookingId} />
          <DeclineButton />
        </form>
      </div>

      {acceptState.error ? (
        <p className="text-sm text-red-600" role="alert">
          {acceptState.error}
        </p>
      ) : null}
      {declineState.error ? (
        <p className="text-sm text-red-600" role="alert">
          {declineState.error}
        </p>
      ) : null}
    </div>
  );
}
