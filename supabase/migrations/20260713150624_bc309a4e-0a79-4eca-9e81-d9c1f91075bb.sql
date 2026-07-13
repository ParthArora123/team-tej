
-- Drop bundle feature entirely
DROP TRIGGER IF EXISTS trg_enforce_enrollment_amount ON public.enrollments;
DROP FUNCTION IF EXISTS public.enforce_enrollment_amount();

ALTER TABLE public.enrollments DROP COLUMN IF EXISTS bundle_purchase_id;

DROP TABLE IF EXISTS public.bundle_offer_programs CASCADE;
DROP TABLE IF EXISTS public.bundle_purchases CASCADE;
DROP TABLE IF EXISTS public.bundle_offers CASCADE;

DROP TYPE IF EXISTS public.bundle_discount_type;
