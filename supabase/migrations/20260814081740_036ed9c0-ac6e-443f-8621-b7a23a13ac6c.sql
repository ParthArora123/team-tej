GRANT SELECT ON public.programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
GRANT SELECT ON public.programs_public TO anon, authenticated;
GRANT ALL ON public.programs_public TO service_role;