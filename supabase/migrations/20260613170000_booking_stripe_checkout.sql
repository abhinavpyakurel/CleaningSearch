-- Stripe Checkout fields and RLS: payment confirmed only via webhook

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Clients no longer mark bookings paid directly from the app
DROP POLICY IF EXISTS bookings_client_confirm_payment ON public.bookings;

-- Allow clients to store a checkout session id while awaiting payment
CREATE POLICY bookings_client_store_checkout_session
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
    AND status = 'accepted_pending_payment'
    AND payment_status = 'unpaid'
    AND stripe_checkout_session_id IS NOT NULL
  );
