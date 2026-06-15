-- Stripe refund tracking for client-cancelled paid bookings

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
