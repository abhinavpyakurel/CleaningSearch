-- Client booking request fields; cleaner assigned later
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_address text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.bookings
  ALTER COLUMN cleaner_id DROP NOT NULL;
