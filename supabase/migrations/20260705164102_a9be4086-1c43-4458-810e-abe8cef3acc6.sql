
DO $$ BEGIN
  CREATE TYPE public.bundle_discount_type AS ENUM ('fixed_bundle_price', 'percentage', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bundle_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  min_workshops INTEGER NOT NULL DEFAULT 2 CHECK (min_workshops >= 2),
  max_workshops INTEGER,
  discount_type public.bundle_discount_type NOT NULL DEFAULT 'fixed_bundle_price',
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  applies_to_all_workshops BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bundle_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_offers TO authenticated;
GRANT ALL ON public.bundle_offers TO service_role;

ALTER TABLE public.bundle_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundle offers"
  ON public.bundle_offers FOR SELECT USING (true);
CREATE POLICY "Admins can insert bundle offers"
  ON public.bundle_offers FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update bundle offers"
  ON public.bundle_offers FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete bundle offers"
  ON public.bundle_offers FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bundle_offers_updated_at
  BEFORE UPDATE ON public.bundle_offers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.bundle_offer_programs (
  bundle_id UUID NOT NULL REFERENCES public.bundle_offers(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, program_id)
);

GRANT SELECT ON public.bundle_offer_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_offer_programs TO authenticated;
GRANT ALL ON public.bundle_offer_programs TO service_role;

ALTER TABLE public.bundle_offer_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundle programs"
  ON public.bundle_offer_programs FOR SELECT USING (true);
CREATE POLICY "Admins manage bundle programs"
  ON public.bundle_offer_programs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.bundle_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.bundle_offers(id) ON DELETE SET NULL,
  bundle_name TEXT,
  workshop_count INTEGER NOT NULL,
  original_amount_inr INTEGER NOT NULL,
  discount_amount_inr INTEGER NOT NULL DEFAULT 0,
  final_amount_inr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  payment_reference TEXT,
  payment_proof_path TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_purchases TO authenticated;
GRANT ALL ON public.bundle_purchases TO service_role;

ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their bundle purchases"
  ON public.bundle_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert their bundle purchases"
  ON public.bundle_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their bundle purchases"
  ON public.bundle_purchases FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete bundle purchases"
  ON public.bundle_purchases FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bundle_purchases_updated_at
  BEFORE UPDATE ON public.bundle_purchases
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS bundle_purchase_id UUID REFERENCES public.bundle_purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_bundle_purchase
  ON public.enrollments (bundle_purchase_id);

CREATE OR REPLACE FUNCTION public.enforce_enrollment_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  p_price integer;
  p_silver boolean;
  p_silver_price integer;
BEGIN
  IF NEW.bundle_purchase_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT price_inr, silver_seat_enabled, COALESCE(silver_seat_price, 1000)
    INTO p_price, p_silver, p_silver_price
    FROM public.programs WHERE id = NEW.program_id;
  IF p_price IS NULL THEN RAISE EXCEPTION 'Program not found'; END IF;
  IF COALESCE(NEW.silver_seat, false) AND COALESCE(p_silver, false) THEN
    NEW.amount_inr := p_price + COALESCE(p_silver_price, 1000);
  ELSE
    NEW.silver_seat := false;
    NEW.amount_inr := p_price;
  END IF;
  RETURN NEW;
END;
$function$;
