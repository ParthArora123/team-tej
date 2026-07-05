
CREATE POLICY "Public read hero-images" ON storage.objects FOR SELECT USING (bucket_id = 'hero-images');
CREATE POLICY "Admins write hero-images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'hero-images' AND private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (bucket_id = 'hero-images' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins write gallery" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'gallery' AND private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (bucket_id = 'gallery' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read featured-banners" ON storage.objects FOR SELECT USING (bucket_id = 'featured-banners');
CREATE POLICY "Admins write featured-banners" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'featured-banners' AND private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (bucket_id = 'featured-banners' AND private.has_role(auth.uid(), 'admin'::app_role));
