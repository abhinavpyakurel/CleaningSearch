-- RLS for cleaner counter offers and client counter responses
-- Counter-offer v1 added columns/status but did not add matching UPDATE policies.

CREATE POLICY bookings_cleaner_submit_counter
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    cleaner_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'cleaner'
    )
  )
  WITH CHECK (
    cleaner_id = auth.uid()
    AND status = 'countered'
  );

CREATE POLICY bookings_client_respond_counter
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'countered'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'client'
    )
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status IN ('confirmed', 'declined')
  );
