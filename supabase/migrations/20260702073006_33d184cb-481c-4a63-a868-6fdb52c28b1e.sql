
-- Drop the broad public SELECT policy on the base table
DROP POLICY IF EXISTS "programs public read published" ON public.programs;

-- Revoke direct SELECT on base table from public roles (server code uses service_role or admin policy)
REVOKE SELECT ON public.programs FROM anon;
REVOKE SELECT ON public.programs FROM authenticated;

-- Create a public-safe view that excludes upi_id_encrypted
DROP VIEW IF EXISTS public.programs_public;
CREATE VIEW public.programs_public
WITH (security_invoker=on) AS
SELECT
  id, kind, name, description, banner_url, event_date, event_time, venue,
  instructor, duration, capacity, seats_taken, price_inr,
  registration_closes_on, category, style, published, created_at
FROM public.programs
WHERE published = true;

GRANT SELECT ON public.programs_public TO anon, authenticated;

-- Re-grant authenticated SELECT on base table so the existing admin RLS policy still works
GRANT SELECT ON public.programs TO authenticated;
