
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_proof_sha256 text;
ALTER TABLE public.bundle_purchases ADD COLUMN IF NOT EXISTS payment_proof_sha256 text;
CREATE INDEX IF NOT EXISTS enrollments_payment_proof_sha256_idx ON public.enrollments (payment_proof_sha256) WHERE payment_proof_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS bundle_purchases_payment_proof_sha256_idx ON public.bundle_purchases (payment_proof_sha256) WHERE payment_proof_sha256 IS NOT NULL;
