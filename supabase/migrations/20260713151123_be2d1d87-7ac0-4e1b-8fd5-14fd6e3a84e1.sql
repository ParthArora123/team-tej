ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS allow_single boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_both boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS both_price integer;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS registration_type text NOT NULL DEFAULT 'single';