
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS silver_seat_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_open_on date,
  ADD COLUMN IF NOT EXISTS banner_path text;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS silver_seat boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.enforce_enrollment_amount()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  p_price integer;
  p_silver boolean;
BEGIN
  SELECT price_inr, silver_seat_enabled INTO p_price, p_silver
    FROM public.programs WHERE id = NEW.program_id;
  IF p_price IS NULL THEN RAISE EXCEPTION 'Program not found'; END IF;
  IF COALESCE(NEW.silver_seat, false) AND COALESCE(p_silver, false) THEN
    NEW.amount_inr := p_price + 1000;
  ELSE
    NEW.silver_seat := false;
    NEW.amount_inr := p_price;
  END IF;
  RETURN NEW;
END;
$$;

DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public AS
SELECT id, kind, name, description, banner_url, banner_path, event_date, event_time, venue,
  instructor, duration, capacity, seats_taken, price_inr, registration_closes_on,
  registration_open_on, category, style, published, silver_seat_enabled, created_at
FROM public.programs WHERE published = true;
GRANT SELECT ON public.programs_public TO anon, authenticated;

DROP POLICY IF EXISTS "workshop_images_admin_insert" ON storage.objects;
CREATE POLICY "workshop_images_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workshop-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "workshop_images_admin_update" ON storage.objects;
CREATE POLICY "workshop_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'workshop-images' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'workshop-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "workshop_images_admin_delete" ON storage.objects;
CREATE POLICY "workshop_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'workshop-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));
