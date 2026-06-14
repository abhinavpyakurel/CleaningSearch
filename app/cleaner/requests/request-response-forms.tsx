"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  acceptRequestAction,
  declineRequestAction,
} from "@/app/cleaner/requests/actions";
import { Button } from "@/components/ui/button";

type RequestActionState = { error: string | null };

const initialState: RequestActionState = { error: null };

type RequestResponseFormsProps = {
  bookingId: string;
};

function AcceptButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Accepting…" : "Accept"}
    </Button>
  );
}

function DeclineButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Declining…" : "Decline"}
    </Button>
  );
}

export function RequestResponseForms({ bookingId }: RequestResponseFormsProps) {
  const [acceptState, acceptAction] = useFormState(
    async (_prev: RequestActionState, formData: FormData) =>
      acceptRequestAction(formData),
    initialState
  );
  const [declineState, declineAction] = useFormState(
    async (_prev: RequestActionState, formData: FormData) =>
      declineRequestAction(formData),
    initialState
  );

  const error = acceptState.error ?? declineState.error;

  return (
    <div className="flex w-full flex-col gap-2">
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
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
