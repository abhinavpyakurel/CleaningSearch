-- Allow booking participants to read each other's display names
CREATE POLICY profiles_select_booking_counterparty
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE
        (b.client_id = auth.uid() AND profiles.id = b.cleaner_id)
        OR (b.cleaner_id = auth.uid() AND profiles.id = b.client_id)
    )
  );
