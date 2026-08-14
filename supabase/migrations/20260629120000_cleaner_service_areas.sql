-- Phase 7A: location-aware cleaner discovery (V1 — one service area per cleaner)

CREATE TABLE public.cleaner_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  city text NOT NULL,
  state char(2) NOT NULL,
  zip_code char(5) NOT NULL,
  radius_miles integer NOT NULL CHECK (radius_miles > 0),
  lat numeric,
  lng numeric,
  is_primary boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_service_areas_state_format CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT cleaner_service_areas_zip_format CHECK (zip_code ~ '^\d{5}$')
);

-- V1: exactly one active service area row per cleaner.
CREATE UNIQUE INDEX cleaner_service_areas_one_per_cleaner
  ON public.cleaner_service_areas (cleaner_id);

CREATE INDEX idx_cleaner_service_areas_zip_code
  ON public.cleaner_service_areas (zip_code)
  WHERE is_active = true;

CREATE INDEX idx_cleaner_service_areas_state_city
  ON public.cleaner_service_areas (state, lower(city))
  WHERE is_active = true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_search_zip char(5),
  ADD COLUMN IF NOT EXISTS search_location_source text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_search_zip_format
  CHECK (
    default_search_zip IS NULL
    OR default_search_zip ~ '^\d{5}$'
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_search_location_source_check
  CHECK (
    search_location_source IS NULL
    OR search_location_source IN ('manual', 'current_location')
  );

ALTER TABLE public.cleaner_service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY cleaner_service_areas_select_own
  ON public.cleaner_service_areas
  FOR SELECT
  TO authenticated
  USING (cleaner_id = auth.uid());

CREATE POLICY cleaner_service_areas_select_marketplace
  ON public.cleaner_service_areas
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.cleaner_profiles cp
      WHERE cp.user_id = cleaner_service_areas.cleaner_id
        AND cp.is_available = true
    )
  );

CREATE POLICY cleaner_service_areas_insert_own
  ON public.cleaner_service_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cleaner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'cleaner'
    )
  );

CREATE POLICY cleaner_service_areas_update_own
  ON public.cleaner_service_areas
  FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());

CREATE POLICY cleaner_service_areas_delete_own
  ON public.cleaner_service_areas
  FOR DELETE
  TO authenticated
  USING (cleaner_id = auth.uid());

-- Marketplace browse: clients read available cleaner profiles.
CREATE POLICY cleaner_profiles_select_available
  ON public.cleaner_profiles
  FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY profiles_select_available_cleaners
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cleaner_profiles cp
      WHERE cp.user_id = profiles.id
        AND cp.is_available = true
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.cleaner_service_areas
  TO authenticated;
