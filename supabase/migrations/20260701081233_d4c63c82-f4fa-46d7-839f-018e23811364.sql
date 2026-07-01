
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_time text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS instructor text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS seats_taken integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_closes_on date,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "programs public read" ON public.programs;
CREATE POLICY "programs public read" ON public.programs
  FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.programs TO anon;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS medical_info text;

INSERT INTO public.app_settings (key, value)
VALUES ('admin_email', 'partharora9722@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) = 'partharora9722@gmail.com'
ON CONFLICT DO NOTHING;
