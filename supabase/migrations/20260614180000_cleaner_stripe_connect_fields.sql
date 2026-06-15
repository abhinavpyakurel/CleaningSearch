ALTER TABLE public.cleaner_profiles
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cleaner_profiles_stripe_account_id
  ON public.cleaner_profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
