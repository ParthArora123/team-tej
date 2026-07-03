
CREATE TABLE public.celebrities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.celebrities TO anon, authenticated;
GRANT ALL ON public.celebrities TO service_role;
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published celebrities" ON public.celebrities FOR SELECT USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins insert celebrities" ON public.celebrities FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins update celebrities" ON public.celebrities FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins delete celebrities" ON public.celebrities FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER tg_celebrities_updated BEFORE UPDATE ON public.celebrities FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published brands" ON public.brands FOR SELECT USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins update brands" ON public.brands FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins delete brands" ON public.brands FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER tg_brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TYPE public.globe_status AS ENUM ('conducted','upcoming');
CREATE TABLE public.globe_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  status public.globe_status NOT NULL DEFAULT 'conducted',
  event_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.globe_locations TO anon, authenticated;
GRANT ALL ON public.globe_locations TO service_role;
ALTER TABLE public.globe_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published globe" ON public.globe_locations FOR SELECT USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins insert globe" ON public.globe_locations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins update globe" ON public.globe_locations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE POLICY "admins delete globe" ON public.globe_locations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER tg_globe_updated BEFORE UPDATE ON public.globe_locations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
