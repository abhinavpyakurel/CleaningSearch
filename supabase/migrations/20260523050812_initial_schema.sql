-- CleanMatch initial schema

CREATE TABLE public.profiles ( id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE, role text NOT NULL CHECK (role IN ('client', 'cleaner')), full_name text, phone text, avatar_url text, created_at timestamptz NOT NULL DEFAULT now() );

CREATE TABLE public.cleaner_profiles ( user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE, bio text, hourly_rate numeric(10, 2), service_radius_miles int, is_available boolean NOT NULL DEFAULT true, lat numeric, lng numeric, total_jobs int NOT NULL DEFAULT 0, avg_rating numeric(3, 2) NOT NULL DEFAULT 0, stripe_account_id text, stripe_onboarded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now() );

CREATE TABLE public.bookings ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE, cleaner_id uuid NOT NULL REFERENCES public.cleaner_profiles (user_id) ON DELETE RESTRICT, status text NOT NULL DEFAULT 'pending' CHECK ( status IN ( 'pending', 'confirmed', 'in_progress', 'completed', 'disputed', 'cancelled' ) ), scheduled_at timestamptz, duration_hours numeric, base_price numeric, platform_fee numeric, total_price numeric, job_scope jsonb, created_at timestamptz NOT NULL DEFAULT now() );

CREATE TABLE public.reviews ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE, reviewer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE, reviewee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE, rating int NOT NULL CHECK (rating >= 1 AND rating <= 5), comment text, created_at timestamptz NOT NULL DEFAULT now() );

CREATE TABLE public.disputes ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE, raised_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE, reason text, evidence_urls text[], status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')), resolution_notes text, created_at timestamptz NOT NULL DEFAULT now() );

CREATE TABLE public.notifications ( id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE, type text NOT NULL, payload jsonb, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now() );

CREATE INDEX idx_bookings_client_id ON public.bookings (client_id); CREATE INDEX idx_bookings_cleaner_id ON public.bookings (cleaner_id); CREATE INDEX idx_bookings_status ON public.bookings (status);

CREATE INDEX idx_reviews_booking_id ON public.reviews (booking_id); CREATE INDEX idx_reviews_reviewer_id ON public.reviews (reviewer_id); CREATE INDEX idx_reviews_reviewee_id ON public.reviews (reviewee_id);

CREATE INDEX idx_disputes_booking_id ON public.disputes (booking_id); CREATE INDEX idx_disputes_raised_by ON public.disputes (raised_by); CREATE INDEX idx_disputes_status ON public.disputes (status);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_booking_participant(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = p_booking_id
      AND (b.client_id = auth.uid() OR b.cleaner_id = auth.uid())
  );
$$; ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.cleaner_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY; ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY; ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY; CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid()); CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid()); CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid()); CREATE POLICY profiles_delete_own ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid()); CREATE POLICY cleaner_profiles_select_own ON public.cleaner_profiles FOR SELECT TO authenticated USING (user_id = auth.uid()); CREATE POLICY cleaner_profiles_insert_own ON public.cleaner_profiles FOR INSERT TO authenticated WITH CHECK ( user_id = auth.uid() AND EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'cleaner' ) ); CREATE POLICY cleaner_profiles_update_own ON public.cleaner_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); CREATE POLICY cleaner_profiles_delete_own ON public.cleaner_profiles FOR DELETE TO authenticated USING (user_id = auth.uid()); CREATE POLICY bookings_select_participant ON public.bookings FOR SELECT TO authenticated USING (client_id = auth.uid() OR cleaner_id = auth.uid()); CREATE POLICY bookings_insert_client ON public.bookings FOR INSERT TO authenticated WITH CHECK ( client_id = auth.uid() AND EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'client' ) ); CREATE POLICY bookings_update_participant ON public.bookings FOR UPDATE TO authenticated USING (client_id = auth.uid() OR cleaner_id = auth.uid()) WITH CHECK (client_id = auth.uid() OR cleaner_id = auth.uid()); CREATE POLICY bookings_delete_client ON public.bookings FOR DELETE TO authenticated USING (client_id = auth.uid()); CREATE POLICY reviews_select_participant ON public.reviews FOR SELECT TO authenticated USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid()); CREATE POLICY reviews_insert_reviewer ON public.reviews FOR INSERT TO authenticated WITH CHECK ( reviewer_id = auth.uid() AND public.is_booking_participant(booking_id) ); CREATE POLICY reviews_update_reviewer ON public.reviews FOR UPDATE TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid()); CREATE POLICY reviews_delete_reviewer ON public.reviews FOR DELETE TO authenticated USING (reviewer_id = auth.uid()); CREATE POLICY disputes_select_participant ON public.disputes FOR SELECT TO authenticated USING ( raised_by = auth.uid() OR public.is_booking_participant(booking_id) ); CREATE POLICY disputes_insert_participant ON public.disputes FOR INSERT TO authenticated WITH CHECK ( raised_by = auth.uid() AND public.is_booking_participant(booking_id) ); CREATE POLICY disputes_update_raiser ON public.disputes FOR UPDATE TO authenticated USING (raised_by = auth.uid()) WITH CHECK (raised_by = auth.uid()); CREATE POLICY disputes_delete_raiser ON public.disputes FOR DELETE TO authenticated USING (raised_by = auth.uid()); CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid()); CREATE POLICY notifications_insert_own ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()); CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid()); GRANT USAGE ON SCHEMA public TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaner_profiles TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.disputes TO authenticated; GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated; GRANT EXECUTE ON FUNCTION public.is_booking_participant(uuid) TO authenticated;