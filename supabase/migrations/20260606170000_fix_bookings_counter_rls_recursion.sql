-- Fix infinite recursion on bookings UPDATE when counter policies query profiles.
-- profiles_select_booking_counterparty reads bookings, re-entering bookings RLS.
-- cleaner_id / client_id FKs already enforce participant identity; no role subquery needed.

DROP POLICY IF EXISTS bookings_cleaner_submit_counter ON public.bookings;

CREATE POLICY bookings_cleaner_submit_counter
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    cleaner_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    cleaner_id = auth.uid()
    AND status = 'countered'
  );

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
    AND status IN ('confirmed', 'declined')
  );
