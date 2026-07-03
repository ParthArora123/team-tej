
-- 1) Make programs_public respect RLS of caller
ALTER VIEW public.programs_public SET (security_invoker = on);

-- 2) Restrict upi_id_encrypted column from anon/authenticated (service_role bypasses)
REVOKE SELECT ON public.programs FROM anon;
REVOKE SELECT ON public.programs FROM authenticated;
GRANT SELECT (id, kind, name, description, banner_url, banner_path, event_date, event_time, venue, instructor, duration, capacity, seats_taken, price_inr, registration_closes_on, registration_open_on, category, style, published, silver_seat_enabled, active, starts_on, seats, created_at)
  ON public.programs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
-- Note: table-level INSERT/UPDATE/DELETE grants still respect RLS; the column REVOKE above only limits SELECT to listed columns.
GRANT ALL ON public.programs TO service_role;

-- 3) Storage: allow public SELECT of workshop-images (bucket serves public workshop banners)
DROP POLICY IF EXISTS "workshop_images_public_select" ON storage.objects;
CREATE POLICY "workshop_images_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'workshop-images');
