update public.choreographies
set video_url = 'workshop-images:' || substring(video_url from '/object/sign/workshop-images/([^?]+)'),
    updated_at = now()
where video_url like 'https://%/object/sign/workshop-images/%';
update public.choreographies
set thumbnail_url = 'workshop-images:' || substring(thumbnail_url from '/object/sign/workshop-images/([^?]+)'),
    updated_at = now()
where thumbnail_url like 'https://%/object/sign/workshop-images/%';