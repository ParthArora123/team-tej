ALTER VIEW public.programs_public SET (security_invoker = false);
GRANT SELECT ON public.programs_public TO anon, authenticated;