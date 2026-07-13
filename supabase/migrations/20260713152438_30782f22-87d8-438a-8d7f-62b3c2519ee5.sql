
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS workshop1_name text,
  ADD COLUMN IF NOT EXISTS workshop2_name text,
  ADD COLUMN IF NOT EXISTS silver_capacity_w1 integer,
  ADD COLUMN IF NOT EXISTS silver_capacity_w2 integer;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS selected_workshop text,
  ADD COLUMN IF NOT EXISTS silver_seat_w1 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS silver_seat_w2 boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public
WITH (security_invoker = true) AS
SELECT
  id, kind, name, description, banner_url, banner_path, banner_video_path, banner_gif_path,
  event_date, event_time, venue, city, instructor, duration, capacity, seats_taken, price_inr,
  registration_open_on, category, style, published, silver_seat_enabled, silver_seat_price,
  bank_account_holder, allow_single, allow_both, both_price,
  workshop1_name, workshop2_name, silver_capacity_w1, silver_capacity_w2,
  created_at
FROM public.programs
WHERE published = true;

GRANT SELECT ON public.programs_public TO anon, authenticated;
