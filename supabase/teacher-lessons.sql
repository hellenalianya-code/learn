-- LearnReach: lessons that teachers add to the syllabus (Hellen, 27 Nov 2026).
-- A teacher's lesson is in her own syllabus straight away. If she shares it (the default), every signed-in teacher sees it too.
-- No approval step: the admin is told about each new or changed lesson in the admin panel and can hide one if needed.
-- Run once in Supabase → SQL Editor. Safe to run again.

create table if not exists public.teacher_lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  teacher_name text check (char_length(teacher_name) <= 120),
  subject text not null check (subject in ('maths', 'english', 'kiswahili', 'science', 'life')),
  mod text not null check (mod in ('num', 'lit', 'kis', 'sci', 'men', 'mind', 'safe', 'self', 'repro')),
  grade int check (grade between 1 and 6),            -- null for Life Skills topics
  after_id text check (char_length(after_id) <= 80), -- the lesson it follows on the journey; null = first
  title text not null check (char_length(title) between 1 and 160),
  lang text not null default 'English' check (lang in ('English', 'Swahili')),
  format text not null default 'Reading' check (format in ('Reading', 'Video', 'Audio')),
  minutes int not null default 20 check (minutes between 5 and 180),
  body jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array' and jsonb_array_length(body) <= 60),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) <= 20),
  media jsonb check (media is null or jsonb_typeof(media) = 'object'), -- { kind: youtube | drive | vimeo | file | link, url, name, type }
  shared boolean not null default true,
  hidden boolean not null default false,     -- set by the admin only
  admin_seen boolean not null default false, -- set by the admin only; goes back to false when the teacher changes the lesson
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teacher_lessons_teacher on public.teacher_lessons (teacher_id);
create index if not exists teacher_lessons_unseen on public.teacher_lessons (admin_seen) where not admin_seen;

-- Only the admin can hide a lesson or mark it seen; any change by a teacher tells the admin again.
create or replace function public.teacher_lessons_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.admin_seen := false;
    if tg_op = 'INSERT' then new.hidden := false; new.teacher_id := auth.uid(); else new.hidden := old.hidden; new.teacher_id := old.teacher_id; end if;
  end if;
  if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
  if tg_op = 'INSERT' or not public.is_admin() then new.updated_at := now(); end if; -- the admin marking a lesson seen does not count as a change
  return new;
end $$;
drop trigger if exists teacher_lessons_guard on public.teacher_lessons;
create trigger teacher_lessons_guard before insert or update on public.teacher_lessons for each row execute function public.teacher_lessons_guard();

alter table public.teacher_lessons enable row level security;
drop policy if exists teacher_lessons_select on public.teacher_lessons;
drop policy if exists teacher_lessons_insert on public.teacher_lessons;
drop policy if exists teacher_lessons_update on public.teacher_lessons;
drop policy if exists teacher_lessons_delete on public.teacher_lessons;
create policy teacher_lessons_select on public.teacher_lessons for select to authenticated
  using (teacher_id = auth.uid() or public.is_admin() or (shared and not hidden));
create policy teacher_lessons_insert on public.teacher_lessons for insert to authenticated with check (teacher_id = auth.uid());
create policy teacher_lessons_update on public.teacher_lessons for update to authenticated
  using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());
create policy teacher_lessons_delete on public.teacher_lessons for delete to authenticated using (teacher_id = auth.uid() or public.is_admin());
revoke all on public.teacher_lessons from anon, public;
grant select, insert, update, delete on public.teacher_lessons to authenticated;

-- Uploaded lesson videos and audio. Readable by anyone with the link (so they play on the classroom screen and can be kept offline);
-- each teacher uploads into her own folder; 50 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-media', 'lesson-media', true, 52428800, array['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists lesson_media_insert on storage.objects;
drop policy if exists lesson_media_update on storage.objects;
drop policy if exists lesson_media_delete on storage.objects;
create policy lesson_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'lesson-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lesson_media_update on storage.objects for update to authenticated
  using (bucket_id = 'lesson-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy lesson_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
