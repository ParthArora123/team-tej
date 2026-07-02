CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;

ALTER POLICY "settings admin read" ON public.app_settings
  USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "settings admin write" ON public.app_settings
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "enrollments admin all" ON public.enrollments
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "enrollments owner read" ON public.enrollments
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

ALTER POLICY "events admin read all" ON public.events
  USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "events admin write" ON public.events
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "profiles self read" ON public.profiles
  USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

ALTER POLICY "programs admin read all" ON public.programs
  USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "programs admin write" ON public.programs
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "testimonials admin manage" ON public.testimonials
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "testimonials admin read all" ON public.testimonials
  USING (private.has_role(auth.uid(), 'admin'));

ALTER POLICY "users read own roles" ON public.user_roles
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));