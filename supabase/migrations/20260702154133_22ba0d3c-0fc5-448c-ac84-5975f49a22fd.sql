
CREATE POLICY "payment_proofs_user_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment_proofs_user_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "payment_proofs_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'::public.app_role));
