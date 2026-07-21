CREATE OR REPLACE VIEW public.programs_public
WITH (security_invoker = on)
AS
SELECT
  id,
  kind,
  name,
  description,
  banner_url,
  banner_path,
  banner_video_path,
  banner_gif_path,
  event_date,
  event_time,
  venue,
  city,
  instructor,
  duration,
  capacity,
  seats_taken,
  price_inr,
  registration_open_on,
  category,
  style,
  published,
  silver_seat_enabled,
  silver_seat_price,
  NULL::text AS bank_account_holder,
  allow_single,
  allow_both,
  both_price,
  workshop1_name,
  workshop2_name,
  silver_capacity_w1,
  silver_capacity_w2,
  created_at
FROM public.programs
WHERE published = true;

REVOKE ALL ON public.programs FROM anon;
REVOKE ALL ON public.programs FROM authenticated;
REVOKE ALL ON public.programs_public FROM anon;
REVOKE ALL ON public.programs_public FROM authenticated;
REVOKE ALL ON public.programs_public FROM service_role;

GRANT SELECT (
  id,
  kind,
  name,
  description,
  banner_url,
  banner_path,
  banner_video_path,
  banner_gif_path,
  event_date,
  event_time,
  venue,
  city,
  instructor,
  duration,
  capacity,
  seats_taken,
  price_inr,
  registration_open_on,
  category,
  style,
  published,
  silver_seat_enabled,
  silver_seat_price,
  allow_single,
  allow_both,
  both_price,
  workshop1_name,
  workshop2_name,
  silver_capacity_w1,
  silver_capacity_w2,
  created_at
) ON public.programs TO anon;

GRANT SELECT (
  id,
  kind,
  name,
  description,
  banner_url,
  banner_path,
  banner_video_path,
  banner_gif_path,
  event_date,
  event_time,
  venue,
  city,
  instructor,
  duration,
  capacity,
  seats_taken,
  price_inr,
  registration_open_on,
  category,
  style,
  published,
  silver_seat_enabled,
  silver_seat_price,
  allow_single,
  allow_both,
  both_price,
  workshop1_name,
  workshop2_name,
  silver_capacity_w1,
  silver_capacity_w2,
  created_at
) ON public.programs TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
GRANT SELECT ON public.programs_public TO anon;
GRANT SELECT ON public.programs_public TO authenticated;
GRANT SELECT ON public.programs_public TO service_role;