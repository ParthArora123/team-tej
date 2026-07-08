
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS banner_video_path text,
  ADD COLUMN IF NOT EXISTS banner_gif_path text;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='programs_public') THEN
    EXECUTE 'DROP VIEW public.programs_public';
  END IF;
END $$;

CREATE VIEW public.programs_public
WITH (security_invoker = true)
AS
  SELECT id, kind, name, description, banner_url, banner_path,
         banner_video_path, banner_gif_path,
         event_date, event_time, venue, city, instructor, duration, capacity,
         seats_taken, price_inr, registration_open_on, category, style, published,
         silver_seat_enabled, silver_seat_price, bank_account_holder, created_at
    FROM public.programs
   WHERE published = true;

GRANT SELECT ON public.programs_public TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.workshop_hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_kind text NOT NULL DEFAULT 'image' CHECK (media_kind IN ('image','video','gif')),
  media_path text NOT NULL,
  poster_path text,
  title text,
  subtitle text,
  description text,
  cta_text text,
  cta_link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workshop_hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshop_hero_slides TO authenticated;
GRANT ALL ON public.workshop_hero_slides TO service_role;

ALTER TABLE public.workshop_hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active workshop hero slides"
  ON public.workshop_hero_slides FOR SELECT
  USING (
    active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

CREATE POLICY "Admins manage workshop hero slides"
  ON public.workshop_hero_slides FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_workshop_hero_slides_updated_at
  BEFORE UPDATE ON public.workshop_hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.workshop_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  media_kind text NOT NULL CHECK (media_kind IN ('image','video','gif')),
  media_path text NOT NULL,
  poster_path text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_media_program ON public.workshop_media(program_id, sort_order);

GRANT SELECT ON public.workshop_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshop_media TO authenticated;
GRANT ALL ON public.workshop_media TO service_role;

ALTER TABLE public.workshop_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads workshop media for published programs"
  ON public.workshop_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
       WHERE p.id = workshop_media.program_id AND p.published = true
    )
  );

CREATE POLICY "Admins manage workshop media"
  ON public.workshop_media FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_workshop_media_updated_at
  BEFORE UPDATE ON public.workshop_media
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "Admins manage workshop-videos objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'workshop-videos' AND private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (bucket_id = 'workshop-videos' AND private.has_role(auth.uid(),'admin'::public.app_role));
