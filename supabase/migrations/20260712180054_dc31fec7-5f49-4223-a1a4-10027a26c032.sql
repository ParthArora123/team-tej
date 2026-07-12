
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.testimonials ALTER COLUMN approved SET DEFAULT true;
