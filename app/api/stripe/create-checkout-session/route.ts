import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";

function getAppOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe secret key not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") {
    return NextResponse.json(
      { error: "Only clients can pay for bookings." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const bookingId =
    body && typeof body.booking_id === "string" ? body.booking_id.trim() : "";

  if (!bookingId) {
    return NextResponse.json(
      { error: "Invalid request: booking_id required" },
      { status: 400 }
    );
  }

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, client_id, status, payment_status, total_price_cents, service_address"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.client_id !== user.id) {
    return NextResponse.json(
      { error: "You cannot pay for this booking." },
      { status: 403 }
    );
  }

  if (booking.status !== "accepted_pending_payment") {
    return NextResponse.json(
      { error: "This booking is not ready for payment." },
      { status: 400 }
    );
  }

  if (booking.payment_status !== "unpaid") {
    return NextResponse.json(
      { error: "This booking has already been paid." },
      { status: 400 }
    );
  }

  if (
    booking.total_price_cents == null ||
    !Number.isFinite(booking.total_price_cents) ||
    booking.total_price_cents <= 0
  ) {
    return NextResponse.json(
      { error: "Booking total is invalid." },
      { status: 400 }
    );
  }

  const appOrigin = getAppOrigin(request);
  const bookingsUrl = `${appOrigin}/client/bookings`;
  const stripe = new Stripe(secretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "usd",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: booking.total_price_cents,
          product_data: {
            name: "CleanMatch booking",
            description: booking.service_address ?? undefined,
          },
        },
      },
    ],
    metadata: {
      booking_id: booking.id,
      client_id: user.id,
    },
    success_url: `${bookingsUrl}?payment=success`,
    cancel_url: `${bookingsUrl}?payment=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .eq("status", "accepted_pending_payment")
    .eq("payment_status", "unpaid")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Could not prepare booking for checkout." },
      { status: 409 }
    );
  }

  return NextResponse.json({ url: session.url });
}
