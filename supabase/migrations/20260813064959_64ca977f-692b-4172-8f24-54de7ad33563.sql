update public.choreographies set
  video_url = 'workshop-images:choreographies/2cea5613-e9d4-4c03-8ef5-1dd894ed38c4-1080.mp4',
  thumbnail_url = coalesce(thumbnail_url, 'workshop-images:choreographies/2cea5613-e9d4-4c03-8ef5-1dd894ed38c4-poster.jpg'),
  updated_at = now()
where video_url like '%2cea5613-e9d4-4c03-8ef5-1dd894ed38c4%';

update public.choreographies set
  video_url = 'workshop-images:choreographies/531f048d-b87e-4b96-b161-33108b304008-1080.mp4',
  thumbnail_url = coalesce(thumbnail_url, 'workshop-images:choreographies/531f048d-b87e-4b96-b161-33108b304008-poster.jpg'),
  updated_at = now()
where video_url like '%531f048d-b87e-4b96-b161-33108b304008%';

update public.choreographies set
  video_url = 'workshop-images:choreographies/6b55ed4d-139d-4905-8e50-a2fd7be121d1-1080.mp4',
  thumbnail_url = coalesce(thumbnail_url, 'workshop-images:choreographies/6b55ed4d-139d-4905-8e50-a2fd7be121d1-poster.jpg'),
  updated_at = now()
where video_url like '%6b55ed4d-139d-4905-8e50-a2fd7be121d1%';