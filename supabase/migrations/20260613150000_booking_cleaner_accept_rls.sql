-- Allow assigned cleaners to accept pending requests into accepted_pending_payment
DROP POLICY IF EXISTS bookings_cleaner_accept_request ON public.bookings;

CREATE POLICY bookings_cleaner_accept_request
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    cleaner_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    cleaner_id = auth.uid()
    AND status = 'accepted_pending_payment'
  );
