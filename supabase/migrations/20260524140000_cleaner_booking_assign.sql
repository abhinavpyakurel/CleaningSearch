-- Cleaner job board: assigned status + RLS for viewing and claiming open jobs
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN (
      'pending',
      'assigned',
      'confirmed',
      'in_progress',
      'completed',
      'disputed',
      'cancelled'
    )
  );

CREATE POLICY bookings_select_available_for_cleaners
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND cleaner_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'cleaner'
    )
  );

CREATE POLICY bookings_accept_for_cleaners
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND cleaner_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'cleaner'
    )
  )
  WITH CHECK (
    cleaner_id = auth.uid()
    AND status = 'assigned'
  );
