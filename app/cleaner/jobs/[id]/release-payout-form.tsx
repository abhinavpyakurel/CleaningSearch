"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  releasePayoutAction,
  type ReleasePayoutActionState,
} from "@/app/cleaner/jobs/[id]/actions";
import { Button } from "@/components/ui/button";

const initialState: ReleasePayoutActionState = { error: null };

type ReleasePayoutFormProps = {
  bookingId: string;
};

function ReleasePayoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Releasing…" : "Release test payout"}
    </Button>
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
    <p className="text-sm text-destructive" role="alert">
      {error}
    </p>
  );
}

export function ReleasePayoutForm({ bookingId }: ReleasePayoutFormProps) {
  const [state, formAction] = useFormState(releasePayoutAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Paid out</p>
        <p className="text-sm text-muted-foreground">
          This payout has been released to your Stripe account.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <ReleasePayoutButton />
      <ReleasePayoutError error={state.error} />
    </form>
  );
}
