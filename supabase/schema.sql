-- LearnReach: teacher accounts, sign-in log and admin access
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (it drops and recreates its own functions, triggers and policies).
--
-- What it creates
--   profiles   one row per registered teacher/admin (created automatically on sign-up)
--   sign_ins   one row per sign-in to the teacher portal or admin page
--   record_sign_in()   called by the apps after each sign-in
--   admin_users()      admin-only list of every account with auth details and sign-in counts
--
-- No learner (child) data is stored here. Only adult staff accounts.

-- ---------- Tables ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null default '',
  email           text,
  phone           text,
  site            text,                      -- club or school, e.g. "Lodwar Girls' Club"
  county          text,
  role            text not null default 'teacher' check (role in ('teacher', 'admin')),
  created_at      timestamptz not null default now(),
  last_sign_in_at timestamptz
);

create table if not exists public.sign_ins (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  signed_in_at timestamptz not null default now(),
  app          text not null default 'teacher-portal' check (app in ('teacher-portal', 'admin')),
  device       text,
  was_offline  boolean not null default false  -- opened offline with a saved sign-in, sent later
);
create index if not exists sign_ins_user_idx on public.sign_ins (user_id, signed_in_at desc);
create index if not exists sign_ins_time_idx on public.sign_ins (signed_in_at desc);

-- ---------- Helpers ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New account → profile. Role is always 'teacher'; admins are promoted by hand (see bottom).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, site, county)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'site', ''),
    nullif(new.raw_user_meta_data ->> 'county', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Called by the apps after a sign-in. p_at lets an offline sign-in be sent later with its real time.
create or replace function public.record_sign_in(p_app text default 'teacher-portal', p_device text default null, p_at timestamptz default null, p_offline boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare t timestamptz := least(coalesce(p_at, now()), now());
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.sign_ins (user_id, signed_in_at, app, device, was_offline)
  values (auth.uid(), t, coalesce(p_app, 'teacher-portal'), left(p_device, 200), coalesce(p_offline, false));
  update public.profiles set last_sign_in_at = greatest(coalesce(last_sign_in_at, t), t) where id = auth.uid();
end $$;

-- Admin-only: every account, with confirmation status and sign-in counts.
create or replace function public.admin_users()
returns table (
  id uuid, full_name text, email text, phone text, site text, county text, role text,
  registered_at timestamptz, email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  sign_ins_total bigint, sign_ins_30d bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  return query
    select p.id, p.full_name, coalesce(p.email, u.email::text), p.phone, p.site, p.county, p.role,
           u.created_at, u.email_confirmed_at, coalesce(p.last_sign_in_at, u.last_sign_in_at),
           (select count(*) from public.sign_ins s where s.user_id = p.id),
           (select count(*) from public.sign_ins s where s.user_id = p.id and s.signed_in_at > now() - interval '30 days')
    from public.profiles p join auth.users u on u.id = p.id
    order by u.created_at desc;
end $$;

-- ---------- Row-level security ----------
alter table public.profiles enable row level security;
alter table public.sign_ins enable row level security;

drop policy if exists "read own profile or admin" on public.profiles;
create policy "read own profile or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "read own sign-ins or admin" on public.sign_ins;
create policy "read own sign-ins or admin" on public.sign_ins
  for select using (user_id = auth.uid() or public.is_admin());
-- No insert policy: sign-ins are written only through record_sign_in().

-- Explicit table access (needed when the project does not grant API access to new tables automatically).
-- Row-level security above still limits which rows each person sees.
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.sign_ins from anon;
grant select on public.profiles, public.sign_ins to authenticated;

-- Teachers may edit their own details but never their role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, site, county) on public.profiles to authenticated;
revoke insert, update, delete on public.sign_ins from authenticated, anon;

revoke execute on function public.admin_users() from public, anon;
revoke execute on function public.record_sign_in(text, text, timestamptz, boolean) from public, anon;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.record_sign_in(text, text, timestamptz, boolean) to authenticated;

-- ---------- Make yourself an admin (run after you have registered) ----------
-- update public.profiles set role = 'admin' where email = 'you@example.org';
