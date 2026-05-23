import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe secret key not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.amount !== "number") {
    return NextResponse.json(
      { error: "Invalid request: amount required" },
      { status: 400 }
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: body.amount,
    currency: "usd",
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
