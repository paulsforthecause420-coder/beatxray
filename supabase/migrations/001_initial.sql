create extension if not exists pgcrypto;

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_path text not null,
  result_path text,
  original_filename text not null,
  daw text not null check (daw in ('flstudio','ableton')),
  status text not null default 'queued' check (status in ('queued','processing','complete','failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  file_size bigint not null check (file_size > 0 and file_size <= 262144000),
  mime_type text,
  analysis jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analysis_jobs enable row level security;
create policy "users read own jobs" on public.analysis_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own jobs" on public.analysis_jobs for insert to authenticated with check ((select auth.uid()) = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('song-uploads','song-uploads',false,262144000,array['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/mp4','audio/aiff','audio/x-aiff'])
on conflict (id) do nothing;
insert into storage.buckets (id,name,public,file_size_limit)
values ('analysis-results','analysis-results',false,1073741824)
on conflict (id) do nothing;

create policy "users upload own songs" on storage.objects for insert to authenticated
with check (bucket_id='song-uploads' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "users read own uploads" on storage.objects for select to authenticated
using (bucket_id='song-uploads' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "users read own results" on storage.objects for select to authenticated
using (bucket_id='analysis-results' and (storage.foldername(name))[1]=(select auth.uid())::text);
