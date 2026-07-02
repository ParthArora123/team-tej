DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'programs'
      AND policyname = 'Published programs are publicly readable'
  ) THEN
    CREATE POLICY "Published programs are publicly readable"
      ON public.programs
      FOR SELECT
      TO anon, authenticated
      USING (published = true);
  END IF;
END $$;

GRANT SELECT (
  id,
  kind,
  name,
  description,
  banner_url,
  event_date,
  event_time,
  venue,
  instructor,
  duration,
  capacity,
  seats_taken,
  price_inr,
  registration_closes_on,
  category,
  style,
  published,
  created_at
) ON public.programs TO anon, authenticated;

GRANT SELECT ON public.programs_public TO anon, authenticated;
GRANT ALL ON public.programs_public TO service_role;