-- Payment state foundation: accepted_pending_payment + payment/payout tracking

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS cleaner_payout_cents integer;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check CHECK (
    payment_status IN ('unpaid', 'paid', 'failed', 'refunded')
  );

-- Drop old payout constraint before migrating values to new vocabulary
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payout_status_check;

-- Migrate payout_status values from completion foundation to payment lifecycle values
UPDATE public.bookings
SET payout_status = CASE payout_status
  WHEN 'not_ready' THEN 'locked'
  WHEN 'pending_release' THEN 'ready'
  WHEN 'released' THEN 'paid'
  WHEN 'locked' THEN 'locked'
  WHEN 'ready' THEN 'ready'
  WHEN 'paid' THEN 'paid'
  WHEN 'paused' THEN 'paused'
  ELSE 'locked'
END;

ALTER TABLE public.bookings
  ALTER COLUMN payout_status SET DEFAULT 'locked';

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payout_status_check CHECK (
    payout_status IN ('locked', 'ready', 'paid', 'paused')
  );

-- Backfill payment_status for existing bookings
UPDATE public.bookings
SET payment_status = 'paid'
WHERE status IN ('confirmed', 'completed', 'in_progress')
  AND payment_status = 'unpaid';

-- Backfill cleaner_payout_cents from service_price_cents where available
UPDATE public.bookings
SET cleaner_payout_cents = service_price_cents
WHERE cleaner_payout_cents IS NULL
  AND service_price_cents IS NOT NULL;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN (
      'pending',
      'assigned',
      'countered',
      'accepted_pending_payment',
      'confirmed',
      'in_progress',
      'completed',
      'disputed',
      'declined',
      'cancelled'
    )
  );

-- Client counter accept now moves to accepted_pending_payment, not confirmed
DROP POLICY IF EXISTS bookings_client_respond_counter ON public.bookings;

CREATE POLICY bookings_client_respond_counter
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'countered'
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status IN ('accepted_pending_payment', 'declined')
  );
