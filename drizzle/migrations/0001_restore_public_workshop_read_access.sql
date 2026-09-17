GRANT SELECT ON TABLE public.programs TO anon, authenticated;
GRANT ALL ON TABLE public.programs TO service_role;
GRANT SELECT ON TABLE public.programs_public TO anon, authenticated;
GRANT ALL ON TABLE public.programs_public TO service_role;