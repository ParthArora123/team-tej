
DELETE FROM public.dance_styles WHERE id = '3e972bab-8e73-4e96-83a3-a348f97e545a';

CREATE TABLE public.zero_to_hero_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_kind TEXT NOT NULL CHECK (media_kind IN ('image','video','gif')),
  media_path TEXT NOT NULL,
  poster_path TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.zero_to_hero_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.zero_to_hero_media TO authenticated;
GRANT ALL ON public.zero_to_hero_media TO service_role;

ALTER TABLE public.zero_to_hero_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active zero-to-hero media"
  ON public.zero_to_hero_media FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage zero-to-hero media"
  ON public.zero_to_hero_media FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER zth_media_updated
  BEFORE UPDATE ON public.zero_to_hero_media
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
