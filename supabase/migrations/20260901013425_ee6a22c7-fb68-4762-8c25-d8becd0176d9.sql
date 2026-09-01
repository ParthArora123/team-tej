DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ')
    INTO cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='programs'
     AND column_name NOT IN ('upi_id_encrypted','bank_account_holder');
  EXECUTE format('GRANT SELECT (%s) ON public.programs TO authenticated', cols);
END $$;