ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS spot_registration_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spot_price_inr integer;