-- Marketplace: clients browse available cleaners and read reviews for trust signals

-- CREATE POLICY cleaner_profiles_select_available
--   ON public.cleaner_profiles
--   FOR SELECT
--   TO authenticated
--   USING (is_available = true);

CREATE POLICY reviews_select_marketplace
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);
