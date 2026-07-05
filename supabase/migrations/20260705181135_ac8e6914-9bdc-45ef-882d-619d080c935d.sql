
CREATE TABLE IF NOT EXISTS public.choreographies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  video_url text,
  youtube_url text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.choreographies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.choreographies TO authenticated;
GRANT ALL ON public.choreographies TO service_role;

ALTER TABLE public.choreographies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published choreographies"
  ON public.choreographies FOR SELECT
  USING (published OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage choreographies"
  ON public.choreographies FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER choreographies_updated
  BEFORE UPDATE ON public.choreographies
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
