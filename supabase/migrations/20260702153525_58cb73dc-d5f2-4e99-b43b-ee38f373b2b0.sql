
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payer_upi_id text,
  ADD COLUMN IF NOT EXISTS payment_utr text;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_payment_utr_unique
  ON public.enrollments (payment_utr)
  WHERE payment_utr IS NOT NULL;
