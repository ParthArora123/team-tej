
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ticket_generated_at TIMESTAMPTZ;

-- Ensure ticket_code stays unique (safety net; index may already exist).
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_ticket_code_key
  ON public.enrollments (ticket_code)
  WHERE ticket_code IS NOT NULL;
