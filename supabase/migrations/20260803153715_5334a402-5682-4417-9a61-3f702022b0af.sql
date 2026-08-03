CREATE TABLE IF NOT EXISTS public.home_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_name text,
  location text,
  achievement text,
  media_kind text NOT NULL DEFAULT 'image',
  media_path text,
  poster_path text,
  cta_text text NOT NULL DEFAULT 'Watch Performance',
  cta_link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_performances TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_performances TO authenticated;
GRANT ALL ON public.home_performances TO service_role;
ALTER TABLE public.home_performances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_performances public read" ON public.home_performances FOR SELECT
  USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "home_performances admin all" ON public.home_performances FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER tg_home_performances_updated BEFORE UPDATE ON public.home_performances
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.signature_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_kind text NOT NULL DEFAULT 'image',
  media_path text,
  poster_path text,
  cta_text text NOT NULL DEFAULT 'Explore',
  cta_link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signature_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signature_programs TO authenticated;
GRANT ALL ON public.signature_programs TO service_role;
ALTER TABLE public.signature_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signature_programs public read" ON public.signature_programs FOR SELECT
  USING (active = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "signature_programs admin all" ON public.signature_programs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER tg_signature_programs_updated BEFORE UPDATE ON public.signature_programs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.signature_programs (title, description, cta_text, cta_link, sort_order) VALUES
  ('Zero to Hero', 'From your very first count to a full performance on stage. The flagship transformation program.', 'Explore Program', '/zero-to-hero', 0),
  ('Wedding Choreography', 'Sangeet sets, couple routines and family performances — choreographed, rehearsed and stage-ready.', 'Book Choreography', '/contact', 1),
  ('Corporate Workshops', 'High-energy team sessions built for offsites, annual days and culture weeks.', 'Enquire Now', '/contact', 2),
  ('Kids Dance', 'Playful, confidence-first training that gets young dancers moving and performing.', 'Enquire Now', '/contact', 3),
  ('Private Training', 'One-on-one coaching shaped entirely around your goals, pace and style.', 'Enquire Now', '/contact', 4),
  ('Online Learning', 'Train with Tejas from anywhere — structured modules and live feedback sessions.', 'Enquire Now', '/contact', 5);