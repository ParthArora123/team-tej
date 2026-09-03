-- On-the-spot (workshop-day) temporary price override.
-- The original price_inr is never modified; spot_price_inr is only used on the
-- exact workshop date when spot_registration_enabled is true.
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS spot_registration_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spot_price_inr integer;

CREATE OR REPLACE VIEW public.programs_public AS
SELECT id, kind, name, description, banner_url, banner_path, banner_video_path, banner_gif_path,
       event_date, event_time, venue, city, instructor, duration, capacity, seats_taken, price_inr,
       registration_open_on, category, style, published, silver_seat_enabled, silver_seat_price,
       NULL::text AS bank_account_holder, allow_single, allow_both, both_price, workshop1_name,
       workshop2_name, silver_capacity_w1, silver_capacity_w2, created_at, venue_address, maps_url,
       latitude, longitude, session_schedule, registration_mode, whatsapp_number,
       spot_registration_enabled, spot_price_inr
FROM programs WHERE published = true;

ALTER VIEW public.programs_public SET (security_invoker = true);
GRANT SELECT ON public.programs_public TO anon, authenticated;