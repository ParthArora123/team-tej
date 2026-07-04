ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_reference text;
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_payment_reference_unique
  ON public.enrollments (lower(payment_reference))
  WHERE payment_reference IS NOT NULL AND status = 'confirmed';