-- Optional floor cleaning area (time only when client selects it)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS clean_floors boolean;
