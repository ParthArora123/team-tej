DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public AS
SELECT id, kind, name, description, banner_url, banner_path, event_date, event_time, venue, city, instructor, duration, capacity, seats_taken, price_inr, registration_open_on, category, style, published, silver_seat_enabled, silver_seat_price, bank_account_holder, active, starts_on, seats, created_at
FROM public.programs
WHERE published = true;

GRANT SELECT ON public.programs_public TO anon, authenticated;