"use client";

import { markJobCompleteAction } from "@/app/cleaner/jobs/[id]/actions";
import { Button } from "@/components/ui/button";

type MarkJobCompleteFormProps = {
  bookingId: string;
};

export function MarkJobCompleteForm({ bookingId }: MarkJobCompleteFormProps) {
  return (
    <form action={markJobCompleteAction}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <Button type="submit" variant="default">
        Mark job complete
      </Button>
    </form>
  );
}
