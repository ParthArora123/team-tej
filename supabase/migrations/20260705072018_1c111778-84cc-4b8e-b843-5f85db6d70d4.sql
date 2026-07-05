
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active hero slides" ON public.hero_slides FOR SELECT USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage hero slides" ON public.hero_slides FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.featured_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  banner_url text,
  description text NOT NULL DEFAULT '',
  city text,
  start_date date,
  end_date date,
  day_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_text text NOT NULL DEFAULT 'Register Now',
  cta_link text NOT NULL DEFAULT '/workshops',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_experience TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.featured_experience TO authenticated;
GRANT ALL ON public.featured_experience TO service_role;
ALTER TABLE public.featured_experience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active featured" ON public.featured_experience FOR SELECT USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage featured" ON public.featured_experience FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER featured_experience_updated_at BEFORE UPDATE ON public.featured_experience FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active gallery" ON public.gallery_items FOR SELECT USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gallery" ON public.gallery_items FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
