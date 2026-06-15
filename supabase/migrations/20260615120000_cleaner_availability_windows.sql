-- Weekly availability windows for cleaners (v1: one window per day)

CREATE TABLE public.cleaner_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_availability_windows_end_after_start CHECK (end_time > start_time),
  CONSTRAINT cleaner_availability_windows_unique_slot
    UNIQUE (cleaner_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_cleaner_availability_windows_cleaner_id
  ON public.cleaner_availability_windows (cleaner_id);

CREATE INDEX idx_cleaner_availability_windows_cleaner_day
  ON public.cleaner_availability_windows (cleaner_id, day_of_week);

ALTER TABLE public.cleaner_availability_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY cleaner_availability_select
  ON public.cleaner_availability_windows
  FOR SELECT
  TO authenticated
  USING (
    cleaner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.cleaner_profiles cp
      WHERE cp.user_id = cleaner_availability_windows.cleaner_id
        AND cp.is_available = true
    )
  );

CREATE POLICY cleaner_availability_insert_own
  ON public.cleaner_availability_windows
  FOR INSERT
  TO authenticated
  WITH CHECK (cleaner_id = auth.uid());

CREATE POLICY cleaner_availability_update_own
  ON public.cleaner_availability_windows
  FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());

CREATE POLICY cleaner_availability_delete_own
  ON public.cleaner_availability_windows
  FOR DELETE
  TO authenticated
  USING (cleaner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.cleaner_availability_windows
  TO authenticated;
