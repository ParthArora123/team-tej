-- Restore SELECT on programs to anon/authenticated for all non-sensitive columns.
-- A prior security fix revoked SELECT entirely, which broke enrollment creation
-- ("Program not found") and dashboard joins on program details.

GRANT SELECT (
  id, kind, name, description, banner_url, banner_path,
  event_date, event_time, venue, instructor, duration,
  capacity, seats_taken, price_inr, registration_open_on,
  category, style, published, silver_seat_enabled, silver_seat_price,
  bank_account_holder, active, starts_on, seats, created_at
) ON public.programs TO anon, authenticated;
