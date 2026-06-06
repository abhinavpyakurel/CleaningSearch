-- Guided booking scope fields for 3-step client intake
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS visit_type text,
  ADD COLUMN IF NOT EXISTS clean_bedrooms boolean,
  ADD COLUMN IF NOT EXISTS clean_bathrooms boolean,
  ADD COLUMN IF NOT EXISTS clean_kitchen boolean,
  ADD COLUMN IF NOT EXISTS clean_common_area boolean,
  ADD COLUMN IF NOT EXISTS clean_hallways boolean,
  ADD COLUMN IF NOT EXISTS home_condition text,
  ADD COLUMN IF NOT EXISTS clutter_level text,
  ADD COLUMN IF NOT EXISTS kitchen_condition text,
  ADD COLUMN IF NOT EXISTS bathroom_condition text,
  ADD COLUMN IF NOT EXISTS pet_hair_level text,
  ADD COLUMN IF NOT EXISTS last_cleaned text,
  ADD COLUMN IF NOT EXISTS floor_type text;
