"use client";

import { useState } from "react";

type PayNowFormProps = {
  bookingId: string;
};

export function PayNowForm({ bookingId }: PayNowFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Could not start checkout.");
        setPending(false);
        return;
      }

      if (!payload?.url) {
        setError("Checkout URL was not returned.");
        setPending(false);
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError("Could not start checkout. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={pending}
        className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] disabled:opacity-60"
      >
        {pending ? "Redirecting to checkout…" : "Pay now to confirm booking"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
