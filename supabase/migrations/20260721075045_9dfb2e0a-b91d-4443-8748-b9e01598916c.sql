-- Restore table-level grants that were dropped by prior security fix.
-- Anon: SELECT on all non-sensitive columns of programs.
GRANT SELECT (
  id, kind, name, description, style, category, instructor, venue, city,
  event_date, event_time, starts_on, registration_open_on, duration,
  price_inr, capacity, seats, seats_taken, published, active, created_at,
  banner_url, banner_path, banner_gif_path, banner_video_path,
  silver_seat_enabled, silver_seat_price, silver_capacity_w1, silver_capacity_w2,
  allow_single, allow_both, both_price, workshop1_name, workshop2_name
) ON public.programs TO anon;

-- Authenticated: full column access via SELECT, plus write for admin policy.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;