
-- Public read access for published catalog tables (missing GRANTs blocked anon)
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;

-- Encrypted UPI ID for per-workshop payments (ciphertext only, never plaintext)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS upi_id_encrypted TEXT;
