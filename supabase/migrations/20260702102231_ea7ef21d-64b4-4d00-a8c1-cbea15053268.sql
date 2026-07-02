
CREATE POLICY "admins read team photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'team-photos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "admins insert team photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-photos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "admins update team photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'team-photos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (bucket_id = 'team-photos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "admins delete team photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'team-photos' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
