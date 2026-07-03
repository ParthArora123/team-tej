
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS bank_account_holder text;

GRANT SELECT (bank_account_holder) ON public.programs TO anon, authenticated;

DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public AS
SELECT id, kind, name, description, banner_url, banner_path, event_date, event_time, venue,
  instructor, duration, capacity, seats_taken, price_inr, registration_closes_on,
  registration_open_on, category, style, published, silver_seat_enabled,
  bank_account_holder, created_at
FROM public.programs WHERE published = true;
ALTER VIEW public.programs_public SET (security_invoker = on);
GRANT SELECT ON public.programs_public TO anon, authenticated;
