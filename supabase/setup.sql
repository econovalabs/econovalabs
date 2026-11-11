-- Run once in the Supabase project's SQL Editor.
-- First create the dashboard user in Authentication > Users:
-- sherin122491@gmail.com (set its password privately; confirm the user).
-- No passwords, secret keys or visitor records belong in this file.
begin;

create schema if not exists econova_private;
revoke all on schema econova_private from public, anon, authenticated;

create table if not exists econova_private.dashboard_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on econova_private.dashboard_admins from public, anon, authenticated;

-- Pin the administrator's immutable user ID, not a client-supplied email.
do $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users
  where lower(email) = 'sherin122491@gmail.com'
    and email_confirmed_at is not null;
  if admin_id is null then
    raise exception 'Create and confirm sherin122491@gmail.com in Authentication > Users first, then run this setup again.';
  end if;
  insert into econova_private.dashboard_admins(user_id)
  values(admin_id) on conflict do nothing;
end $$;

create or replace function econova_private.is_dashboard_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from econova_private.dashboard_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function econova_private.is_dashboard_admin() from public, anon;
grant usage on schema econova_private to authenticated;
grant execute on function econova_private.is_dashboard_admin() to authenticated;

create table if not exists public.econova_feedback (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  rating integer not null check (rating between 1 and 5),
  comments text not null check (char_length(comments) between 5 and 2000),
  consent_version text not null default 'feedback-v1'
);
create index if not exists econova_feedback_created_at_idx
  on public.econova_feedback(created_at desc, id desc);
alter table public.econova_feedback enable row level security;
revoke all on public.econova_feedback from public, anon, authenticated;
grant select on public.econova_feedback to authenticated;
drop policy if exists econova_admin_read on public.econova_feedback;
create policy econova_admin_read on public.econova_feedback
for select to authenticated using ((select econova_private.is_dashboard_admin()));

create table if not exists econova_private.feedback_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
revoke all on econova_private.feedback_limits from public, anon, authenticated;

create or replace function public.econova_admin_status()
returns boolean language sql stable security invoker set search_path = ''
as $$ select econova_private.is_dashboard_admin(); $$;
revoke all on function public.econova_admin_status() from public, anon;
grant execute on function public.econova_admin_status() to authenticated;

create or replace function public.econova_feedback_health()
returns jsonb language sql stable set search_path = ''
as $$ select pg_catalog.jsonb_build_object('schemaVersion', 1); $$;
revoke all on function public.econova_feedback_health() from public;
grant execute on function public.econova_feedback_health() to anon, authenticated;

create or replace function public.econova_submit_feedback(
  p_id uuid, p_name text, p_email text, p_rating integer,
  p_comments text, p_consent boolean, p_website text default ''
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  clean_name text := btrim(p_name);
  clean_email text := lower(btrim(p_email));
  clean_comments text := btrim(p_comments);
  submissions integer;
  existing_id uuid;
begin
  if p_id is null or p_consent is distinct from true
    or coalesce(p_website, '') <> ''
    or clean_name is null or char_length(clean_name) not between 2 and 100
    or clean_name ~ '[[:cntrl:]]'
    or clean_email is null or char_length(clean_email) > 254
    or clean_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+[.][^[:space:]@<>]+$'
    or p_rating is null or p_rating not between 1 and 5
    or clean_comments is null or char_length(clean_comments) not between 5 and 2000
    or translate(clean_comments, chr(9)||chr(10)||chr(13), '') ~ '[[:cntrl:]]'
  then raise exception using errcode='22023', message='Enter your name, valid email, rating, suggestions/details and consent.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(clean_email, 0));
  select id into existing_id from public.econova_feedback
    where id = p_id and email = clean_email;
  if existing_id is not null then
    return pg_catalog.jsonb_build_object('id', existing_id);
  end if;

  insert into econova_private.feedback_limits(key, count, expires_at)
    values(md5(clean_email), 1, now() + interval '1 hour')
  on conflict(key) do update set
    count = case when feedback_limits.expires_at <= now() then 1 else feedback_limits.count + 1 end,
    expires_at = case when feedback_limits.expires_at <= now() then excluded.expires_at else feedback_limits.expires_at end
  returning count into submissions;
  if submissions > 3 then
    raise exception using errcode='P0001', message='You have submitted several responses. Please try again in an hour.';
  end if;

  insert into public.econova_feedback(id, name, email, rating, comments, consent_version)
    values(p_id, clean_name, clean_email, p_rating, clean_comments, 'feedback-v1');
  delete from econova_private.feedback_limits where expires_at < now() - interval '1 day';
  return pg_catalog.jsonb_build_object('id', p_id);
end;
$$;
revoke all on function public.econova_submit_feedback(uuid,text,text,integer,text,boolean,text) from public;
grant execute on function public.econova_submit_feedback(uuid,text,text,integer,text,boolean,text) to anon, authenticated;

create or replace function public.econova_list_feedback(
  p_search text default '', p_rating integer default null,
  p_page integer default 1, p_export boolean default false
) returns jsonb language plpgsql stable security invoker set search_path = ''
as $$
declare
  search_text text := lower(left(btrim(coalesce(p_search, '')), 100));
  selected_page integer := greatest(1, least(coalesce(p_page, 1), 100000));
  total_count bigint;
  average_rating numeric;
  rating_counts jsonb;
  entries jsonb;
begin
  if not econova_private.is_dashboard_admin() then
    raise exception using errcode='42501', message='This account does not have dashboard access.';
  end if;
  if p_rating is not null and p_rating not between 1 and 5 then
    raise exception using errcode='22023', message='Invalid rating filter.';
  end if;
  select count(*), avg(rating) into total_count, average_rating
  from public.econova_feedback
  where (p_rating is null or rating = p_rating)
    and (search_text = '' or strpos(lower(name),search_text)>0
      or strpos(lower(email),search_text)>0 or strpos(lower(comments),search_text)>0);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into rating_counts from (
    select rating, count(*) as count from public.econova_feedback
    where (p_rating is null or rating = p_rating)
      and (search_text = '' or strpos(lower(name),search_text)>0
        or strpos(lower(email),search_text)>0 or strpos(lower(comments),search_text)>0)
    group by rating order by rating desc
  ) t;
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into entries from (
    select id, created_at, name, email, rating, comments from public.econova_feedback
    where (p_rating is null or rating = p_rating)
      and (search_text = '' or strpos(lower(name),search_text)>0
        or strpos(lower(email),search_text)>0 or strpos(lower(comments),search_text)>0)
    order by created_at desc, id desc
    limit case when p_export then 10000 else 25 end
    offset case when p_export then 0 else (selected_page - 1) * 25 end
  ) t;
  return jsonb_build_object('items', entries, 'total', total_count,
    'average', average_rating, 'breakdown', rating_counts,
    'page', selected_page, 'pageSize', 25);
end;
$$;
revoke all on function public.econova_list_feedback(text,integer,integer,boolean) from public, anon;
grant execute on function public.econova_list_feedback(text,integer,integer,boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
