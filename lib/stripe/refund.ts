import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/connect";

type CreateBookingRefundInput = {
  paymentIntentId: string;
  bookingId: string;
  clientId: string;
};

export async function createBookingRefund(
  input: CreateBookingRefundInput
): Promise<Stripe.Refund> {
  const stripe = getStripe();

  return stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    metadata: {
      booking_id: input.bookingId,
      client_id: input.clientId,
      reason: "client_cancel_more_than_24h",
    },
  });
}
