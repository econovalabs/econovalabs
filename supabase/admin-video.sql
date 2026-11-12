-- Optional private video storage for the administrator's product walkthrough.
-- Run in Supabase SQL Editor after the main feedback setup.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('econova-admin-media','econova-admin-media',false,52428800,array['video/mp4','video/webm'])
on conflict(id) do update set public=false, file_size_limit=52428800,
  allowed_mime_types=array['video/mp4','video/webm'];
drop policy if exists econova_admin_media_read on storage.objects;
create policy econova_admin_media_read on storage.objects for select to authenticated
using(bucket_id='econova-admin-media' and (select econova_private.is_dashboard_admin()));
drop policy if exists econova_admin_media_create on storage.objects;
create policy econova_admin_media_create on storage.objects for insert to authenticated
with check(bucket_id='econova-admin-media' and (select econova_private.is_dashboard_admin()));
drop policy if exists econova_admin_media_replace on storage.objects;
create policy econova_admin_media_replace on storage.objects for update to authenticated
using(bucket_id='econova-admin-media' and (select econova_private.is_dashboard_admin()))
with check(bucket_id='econova-admin-media' and (select econova_private.is_dashboard_admin()));
commit;
