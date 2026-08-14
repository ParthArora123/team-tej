create policy "Public can read testimonial videos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'testimonial-videos');

create policy "Authenticated users can upload testimonial videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'testimonial-videos');