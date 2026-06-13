-- Two-sided booking completion confirmation + payout readiness tracking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cleaner_marked_complete_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_marked_complete_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_disputed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_dispute_reason text,
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'not_ready';

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payout_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payout_status_check CHECK (
    payout_status IN ('not_ready', 'pending_release', 'released', 'paused')
  );
