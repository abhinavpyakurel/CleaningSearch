"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  releasePayoutAction,
  type ReleasePayoutActionState,
} from "@/app/cleaner/jobs/[id]/actions";

const initialState: ReleasePayoutActionState = { error: null };

type ReleasePayoutFormProps = {
  bookingId: string;
};

function ReleasePayoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] disabled:opacity-60"
    >
      {pending ? "Releasing…" : "Release test payout"}
    </button>
  );
}

function ReleasePayoutError({
  error,
}: {
  error: string | null | undefined;
}) {
  const { pending } = useFormStatus();

  if (!error || pending) {
    return null;
  }

  return (
    <p className="text-sm text-red-600" role="alert">
      {error}
    </p>
  );
}

export function ReleasePayoutForm({ bookingId }: ReleasePayoutFormProps) {
  const [state, formAction] = useFormState(releasePayoutAction, initialState);

  if (state.success) {
    return (
      <div className="mt-4 space-y-1">
        <p className="text-sm font-semibold text-green-700">Paid out</p>
        <p className="text-sm text-gray-600">
          This payout has been released to your Stripe account.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <ReleasePayoutButton />
      <ReleasePayoutError error={state.error} />
    </form>
  );
}
