GRANT SELECT ON public.signature_programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.signature_programs TO authenticated;
GRANT ALL ON public.signature_programs TO service_role;
GRANT SELECT ON public.home_performances TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_performances TO authenticated;
GRANT ALL ON public.home_performances TO service_role;