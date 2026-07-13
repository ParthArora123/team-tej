DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public AS
SELECT id, kind, name, description, banner_url, banner_path, banner_video_path, banner_gif_path,
       event_date, event_time, venue, city, instructor, duration, capacity, seats_taken,
       price_inr, registration_open_on, category, style, published,
       silver_seat_enabled, silver_seat_price, bank_account_holder,
       created_at,
       allow_single, allow_both, both_price
FROM public.programs
WHERE published = true;
GRANT SELECT ON public.programs_public TO anon, authenticated;