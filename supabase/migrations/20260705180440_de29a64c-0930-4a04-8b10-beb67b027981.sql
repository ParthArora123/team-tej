
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.bundle_offers ADD COLUMN IF NOT EXISTS eligible_cities text[] NOT NULL DEFAULT '{}';
