-- Booking photos metadata + storage policies for private booking-photos bucket

CREATE TABLE public.booking_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users (id),
  storage_bucket text NOT NULL DEFAULT 'booking-photos',
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_photos_booking_id ON public.booking_photos (booking_id);

ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_photos_insert_client
  ON public.booking_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
        AND b.client_id = auth.uid()
    )
  );

CREATE POLICY booking_photos_select_client
  ON public.booking_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_photos.booking_id
        AND b.client_id = auth.uid()
    )
  );

CREATE POLICY booking_photos_select_cleaner
  ON public.booking_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_photos.booking_id
        AND b.cleaner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.booking_photos TO authenticated;

CREATE POLICY booking_photos_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'booking-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY booking_photos_storage_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1
      FROM public.booking_photos bp
      WHERE bp.storage_path = name
        AND public.is_booking_participant(bp.booking_id)
    )
  );
