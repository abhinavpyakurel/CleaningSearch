-- Allow booking clients to confirm payment on accepted_pending_payment bookings.
-- Server action enforces old-state filters; this policy validates the resulting row.
CREATE POLICY bookings_client_confirm_payment
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'accepted_pending_payment'
    AND payment_status = 'unpaid'
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'confirmed'
    AND payment_status = 'paid'
    AND paid_at IS NOT NULL
    AND payout_status = 'locked'
  );
