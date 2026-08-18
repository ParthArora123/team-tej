CREATE TABLE public.program_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  max_registrations integer NOT NULL CHECK (max_registrations > 0),
  price_inr integer NOT NULL CHECK (price_inr >= 0),
  both_price integer CHECK (both_price IS NULL OR both_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_program_price_tiers_program ON public.program_price_tiers(program_id, sort_order);

GRANT SELECT ON public.program_price_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_price_tiers TO authenticated;
GRANT ALL ON public.program_price_tiers TO service_role;

ALTER TABLE public.program_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tiers of published workshops"
ON public.program_price_tiers FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.published));

CREATE POLICY "Admins can view all tiers"
ON public.program_price_tiers FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage tiers"
ON public.program_price_tiers FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tg_program_price_tiers_updated
BEFORE UPDATE ON public.program_price_tiers
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS price_tier_id uuid REFERENCES public.program_price_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tier_price_inr integer,
  ADD COLUMN IF NOT EXISTS silver_amount_inr integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_program_price_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
  running integer := 0;
  t record;
  chosen record;
  base integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.program_price_tiers WHERE program_id = NEW.program_id) THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent registrations for this workshop so the tier count
  -- and the applicable price are always consistent.
  PERFORM pg_advisory_xact_lock(hashtextextended('program_price_tier', 0), hashtextextended(NEW.program_id::text, 0));

  SELECT count(*) INTO used
  FROM public.enrollments
  WHERE program_id = NEW.program_id
    AND status IN ('awaiting_payment', 'payment_submitted', 'confirmed');

  FOR t IN
    SELECT * FROM public.program_price_tiers
    WHERE program_id = NEW.program_id
    ORDER BY sort_order, created_at
  LOOP
    running := running + t.max_registrations;
    chosen := t;
    IF used < running THEN
      EXIT;
    END IF;
  END LOOP;

  IF chosen IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.registration_type = 'both' AND chosen.both_price IS NOT NULL THEN
    base := chosen.both_price;
  ELSIF NEW.registration_type = 'both' THEN
    RETURN NEW;
  ELSE
    base := chosen.price_inr;
  END IF;

  NEW.price_tier_id := chosen.id;
  NEW.tier_price_inr := base;
  NEW.amount_inr := base + COALESCE(NEW.silver_amount_inr, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_enrollments_apply_price_tier
BEFORE INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.apply_program_price_tier();

CREATE OR REPLACE FUNCTION public.get_program_pricing(_program_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
  running integer := 0;
  t record;
  tiers jsonb := '[]'::jsonb;
  current_tier jsonb := NULL;
  found boolean := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.program_price_tiers WHERE program_id = _program_id) THEN
    RETURN jsonb_build_object('registration_count', 0, 'tiers', tiers, 'current', NULL);
  END IF;

  SELECT count(*) INTO used
  FROM public.enrollments
  WHERE program_id = _program_id
    AND status IN ('awaiting_payment', 'payment_submitted', 'confirmed');

  FOR t IN
    SELECT * FROM public.program_price_tiers
    WHERE program_id = _program_id
    ORDER BY sort_order, created_at
  LOOP
    running := running + t.max_registrations;
    tiers := tiers || jsonb_build_object(
      'id', t.id,
      'label', t.label,
      'sort_order', t.sort_order,
      'max_registrations', t.max_registrations,
      'price_inr', t.price_inr,
      'both_price', t.both_price,
      'remaining', GREATEST(running - used, 0),
      'sold_out', used >= running AND found = false AND running <= used
    );
    IF NOT found AND used < running THEN
      found := true;
      current_tier := jsonb_build_object(
        'id', t.id,
        'label', t.label,
        'price_inr', t.price_inr,
        'both_price', t.both_price,
        'max_registrations', t.max_registrations,
        'remaining', running - used
      );
    END IF;
  END LOOP;

  IF current_tier IS NULL THEN
    SELECT jsonb_build_object(
      'id', x.id, 'label', x.label, 'price_inr', x.price_inr,
      'both_price', x.both_price, 'max_registrations', x.max_registrations, 'remaining', 0
    ) INTO current_tier
    FROM public.program_price_tiers x
    WHERE x.program_id = _program_id
    ORDER BY x.sort_order DESC, x.created_at DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object('registration_count', used, 'tiers', tiers, 'current', current_tier);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_program_pricing(uuid) TO anon, authenticated, service_role;