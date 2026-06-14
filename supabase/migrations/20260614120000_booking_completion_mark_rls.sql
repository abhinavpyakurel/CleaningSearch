-- Allow booking participants to mark paid confirmed bookings complete.
-- Server actions enforce old-state filters; these policies validate the resulting row.

CREATE POLICY bookings_client_mark_complete
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'confirmed'
    AND payment_status = 'paid'
    AND client_marked_complete_at IS NULL
  )
  WITH CHECK (
    client_id = auth.uid()
    AND payment_status = 'paid'
    AND client_marked_complete_at IS NOT NULL
    AND (
      (
        status = 'confirmed'
        AND payout_status = 'locked'
        AND cleaner_marked_complete_at IS NULL
      )
      OR (
        status = 'completed'
        AND payout_status = 'ready'
        AND cleaner_marked_complete_at IS NOT NULL
      )
    )
  );

CREATE POLICY bookings_cleaner_mark_complete
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    cleaner_id = auth.uid()
    AND status = 'confirmed'
    AND payment_status = 'paid'
    AND cleaner_marked_complete_at IS NULL
  )
  WITH CHECK (
    cleaner_id = auth.uid()
    AND payment_status = 'paid'
    AND cleaner_marked_complete_at IS NOT NULL
    AND (
      (
        status = 'confirmed'
        AND payout_status = 'locked'
        AND client_marked_complete_at IS NULL
      )
      OR (
        status = 'completed'
        AND payout_status = 'ready'
        AND client_marked_complete_at IS NOT NULL
      )
    )
  );
