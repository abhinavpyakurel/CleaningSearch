-- Cleaner quantitative counter offer fields + countered/declined statuses
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS counter_adjustments jsonb,
  ADD COLUMN IF NOT EXISTS counter_scope_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS counter_hours numeric,
  ADD COLUMN IF NOT EXISTS counter_total_price_cents integer,
  ADD COLUMN IF NOT EXISTS counter_reason text,
  ADD COLUMN IF NOT EXISTS countered_at timestamptz;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN (
      'pending',
      'assigned',
      'countered',
      'confirmed',
      'in_progress',
      'completed',
      'disputed',
      'declined',
      'cancelled'
    )
  );
