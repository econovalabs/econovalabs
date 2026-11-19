-- Run after setup.sql. The bucket is private and uses the existing admin identity check.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tef-private-demo','tef-private-demo',false,1048576,array['text/html'])
on conflict(id) do update set public=false,file_size_limit=1048576,allowed_mime_types=array['text/html'];
drop policy if exists tef_demo_admin_read on storage.objects;
create policy tef_demo_admin_read on storage.objects for select to authenticated
using(bucket_id='tef-private-demo' and name='index.html' and (select econova_private.is_dashboard_admin()));
commit;
