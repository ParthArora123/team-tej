
-- 1) Enforce amount_inr from programs.price_inr (block client tampering via REST)
CREATE OR REPLACE FUNCTION public.enforce_enrollment_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  p_price integer;
BEGIN
  SELECT price_inr INTO p_price FROM public.programs WHERE id = NEW.program_id;
  IF p_price IS NULL THEN
    RAISE EXCEPTION 'Program not found';
  END IF;
  NEW.amount_inr := p_price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_enrollment_amount ON public.enrollments;
CREATE TRIGGER trg_enforce_enrollment_amount
BEFORE INSERT OR UPDATE OF program_id, amount_inr ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.enforce_enrollment_amount();

-- 2) Explicit admin-only write policies on user_roles (defense-in-depth)
DROP POLICY IF EXISTS "user_roles admin insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles admin update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles admin delete" ON public.user_roles;

CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Explicit admin-only DELETE policy on enrollments
DROP POLICY IF EXISTS "enrollments admin delete" ON public.enrollments;
CREATE POLICY "enrollments admin delete" ON public.enrollments
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 4) Remove the public.has_role duplicate (private.has_role is the one in use)
--    and lock down handle_new_user (trigger-only; not for API callers)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
