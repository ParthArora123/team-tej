
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admin write site content" ON public.site_content FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.site_content (key, value) VALUES
('contact', jsonb_build_object(
  'email','hello@teamtej.com','phone','+91 98765 43210','whatsapp','+91 98765 43210',
  'address','12 Linking Road, Bandra West, Mumbai 400050',
  'hours_line1','Monday – Saturday · 9:00 AM – 10:00 PM','hours_line2','Sunday · By appointment'
)),
('about', jsonb_build_object(
  'eyebrow','About',
  'headline','Twelve years of teaching India to move differently.',
  'paragraphs', jsonb_build_array(
    'Tejas D Dhoke began in a borrowed studio in 2013 with six dancers and one stubborn belief — that Indian dance shouldn''t have to pick a lane. Today it''s a full company of performers, choreographers and students working across film, festivals and live productions.',
    'Our fusion approach pulls from Kathak''s footwork, contemporary''s release, Bollywood''s expression, and hip-hop''s groove. The result isn''t a style — it''s a vocabulary.',
    'We train roughly 300 students a year across five batches, and our performance wing has toured 12 cities.'
  ),
  'values_title','What we stand on',
  'values', jsonb_build_array(
    jsonb_build_object('title','Discipline','body','Every form starts with foundation. We drill until it''s muscle memory.'),
    jsonb_build_object('title','Fusion','body','Classical, contemporary, urban — borders are where the best work happens.'),
    jsonb_build_object('title','Stage-first','body','We train for performance, not just for class. Every batch performs.')
  )
));

CREATE TABLE public.dance_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  image_url text,
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dance_styles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dance_styles TO authenticated;
GRANT ALL ON public.dance_styles TO service_role;
ALTER TABLE public.dance_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active styles" ON public.dance_styles FOR SELECT USING (active OR private.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin write styles" ON public.dance_styles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER dance_styles_updated_at BEFORE UPDATE ON public.dance_styles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
