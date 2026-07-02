
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_proof_path text;

DROP INDEX IF EXISTS public.enrollments_payment_utr_unique;
ALTER TABLE public.enrollments
  DROP COLUMN IF EXISTS payer_upi_id,
  DROP COLUMN IF EXISTS payment_utr;
