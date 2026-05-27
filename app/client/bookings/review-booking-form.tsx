"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  createReviewAction,
  type ReviewActionState,
} from "@/app/client/reviews/actions";

const initialState: ReviewActionState = {};

type ReviewBookingFormProps = {
  bookingId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit review"}
    </button>
  );
}

export function ReviewBookingForm({ bookingId }: ReviewBookingFormProps) {
  const [state, formAction] = useFormState(createReviewAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <p className="text-sm font-semibold text-gray-900">Leave a review</p>
      <input type="hidden" name="booking_id" value={bookingId} />
      <div>
        <label htmlFor={`rating-${bookingId}`} className="text-xs font-medium text-gray-500">
          Rating (1–5)
        </label>
        <select
          id={`rating-${bookingId}`}
          name="rating"
          required
          defaultValue="5"
          className="mt-1 block w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? "star" : "stars"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`comment-${bookingId}`} className="text-xs font-medium text-gray-500">
          Comment (optional)
        </label>
        <textarea
          id={`comment-${bookingId}`}
          name="comment"
          rows={3}
          placeholder="How did the cleaning go?"
          className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
