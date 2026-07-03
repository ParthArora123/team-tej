
-- 1) Drop the public view first so we can drop the column it depends on
DROP VIEW IF EXISTS public.programs_public;

-- 2) Add silver_seat_price with sensible default
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS silver_seat_price integer NOT NULL DEFAULT 1000;

-- 3) Drop unused registration_closes_on column
ALTER TABLE public.programs
  DROP COLUMN IF EXISTS registration_closes_on;

-- 4) Rebuild public view without registration_closes_on and including silver_seat_price
CREATE VIEW public.programs_public
WITH (security_invoker = on) AS
SELECT
  id, kind, name, description, banner_url, banner_path,
  event_date, event_time, venue, instructor, duration,
  capacity, seats_taken, price_inr, registration_open_on,
  category, style, published, silver_seat_enabled,
  silver_seat_price, bank_account_holder, active, starts_on, seats, created_at
FROM public.programs;

GRANT SELECT ON public.programs_public TO anon, authenticated;

-- 5) Refresh column-level SELECT grants on programs
REVOKE SELECT ON public.programs FROM anon, authenticated;
GRANT SELECT (
  id, kind, name, description, banner_url, banner_path, event_date, event_time,
  venue, instructor, duration, capacity, seats_taken, price_inr,
  registration_open_on, category, style, published, silver_seat_enabled,
  silver_seat_price, bank_account_holder, active, starts_on, seats, created_at
) ON public.programs TO anon, authenticated;

-- 6) Update enrollment amount trigger to use per-workshop silver_seat_price
CREATE OR REPLACE FUNCTION public.enforce_enrollment_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  p_price integer;
  p_silver boolean;
  p_silver_price integer;
BEGIN
  SELECT price_inr, silver_seat_enabled, COALESCE(silver_seat_price, 1000)
    INTO p_price, p_silver, p_silver_price
    FROM public.programs WHERE id = NEW.program_id;
  IF p_price IS NULL THEN RAISE EXCEPTION 'Program not found'; END IF;
  IF COALESCE(NEW.silver_seat, false) AND COALESCE(p_silver, false) THEN
    NEW.amount_inr := p_price + COALESCE(p_silver_price, 1000);
  ELSE
    NEW.silver_seat := false;
    NEW.amount_inr := p_price;
  END IF;
  RETURN NEW;
END;
$function$;
