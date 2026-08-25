ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS confirmation_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_email_error text;