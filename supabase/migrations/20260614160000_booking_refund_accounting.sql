-- Refund accounting for partial (service-only) cancellations

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refund_amount_cents integer,
  ADD COLUMN IF NOT EXISTS non_refundable_fee_cents integer;
