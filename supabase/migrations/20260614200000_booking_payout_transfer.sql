-- Payout transfer tracking: store Stripe transfer id and payout timestamp

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS paid_out_at timestamptz;
