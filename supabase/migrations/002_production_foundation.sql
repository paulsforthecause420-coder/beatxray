create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.analysis_jobs add column if not exists idempotency_key text;
alter table public.analysis_jobs add column if not exists stage text not null default 'queued';
alter table public.analysis_jobs add column if not exists retry_count integer not null default 0;
alter table public.analysis_jobs add column if not exists error_code text;
alter table public.analysis_jobs add column if not exists started_at timestamptz;
alter table public.analysis_jobs add column if not exists completed_at timestamptz;
create unique index if not exists analysis_jobs_user_idempotency_idx on public.analysis_jobs(user_id,idempotency_key) where idempotency_key is not null;

alter table public.analysis_jobs drop constraint if exists analysis_jobs_status_check;
alter table public.analysis_jobs add constraint analysis_jobs_status_check check (status in ('created','uploading','queued','preprocessing','separating','analyzing_rhythm','analyzing_harmony','analyzing_effects','transcribing','packaging','complete','failed','cancelled'));

create table if not exists public.analysis_events (
 id bigint generated always as identity primary key, job_id uuid not null references public.analysis_jobs(id) on delete cascade,
 stage text not null, event_type text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.analysis_results (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.analysis_jobs(id) on delete cascade,
 schema_version text not null, model_versions jsonb not null default '{}'::jsonb, result_json jsonb not null,
 created_at timestamptz not null default now(), unique(job_id,schema_version)
);
create table if not exists public.artifacts (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.analysis_jobs(id) on delete cascade,
 type text not null, storage_path text not null, size_bytes bigint, checksum text, expires_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade, stripe_customer_id text unique, stripe_subscription_id text unique,
 plan text not null default 'free', status text not null default 'inactive', current_period_end timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.usage_ledger (
 id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
 job_id uuid references public.analysis_jobs(id) on delete set null, quantity numeric not null, unit text not null, reason text not null,
 idempotency_key text unique, created_at timestamptz not null default now()
);
create table if not exists public.lesson_catalog (
 id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, level text not null,
 concept text not null, body jsonb not null default '{}'::jsonb, review_status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lesson_rules (
 id uuid primary key default gen_random_uuid(), concept text not null, threshold numeric not null check (threshold between 0 and 1),
 lesson_id uuid not null references public.lesson_catalog(id) on delete cascade, priority integer not null default 100
);
create table if not exists public.lesson_progress (
 user_id uuid not null references auth.users(id) on delete cascade, lesson_id uuid not null references public.lesson_catalog(id) on delete cascade,
 state text not null default 'started', score numeric, completed_at timestamptz, updated_at timestamptz not null default now(), primary key(user_id,lesson_id)
);
create table if not exists public.webhook_events (
 id bigint generated always as identity primary key, provider text not null, event_id text not null, type text not null,
 status text not null default 'received', payload_hash text, created_at timestamptz not null default now(), unique(provider,event_id)
);
create table if not exists public.audit_log (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id) on delete set null,
 action text not null, target_type text, target_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.analysis_events enable row level security;
alter table public.analysis_results enable row level security;
alter table public.artifacts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.lesson_catalog enable row level security;
alter table public.lesson_rules enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles read own" on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "events read own job" on public.analysis_events for select to authenticated using (exists(select 1 from public.analysis_jobs j where j.id=job_id and j.user_id=(select auth.uid())));
create policy "results read own job" on public.analysis_results for select to authenticated using (exists(select 1 from public.analysis_jobs j where j.id=job_id and j.user_id=(select auth.uid())));
create policy "artifacts read own job" on public.artifacts for select to authenticated using (exists(select 1 from public.analysis_jobs j where j.id=job_id and j.user_id=(select auth.uid())));
create policy "subscriptions read own" on public.subscriptions for select to authenticated using (user_id=(select auth.uid()));
create policy "usage read own" on public.usage_ledger for select to authenticated using (user_id=(select auth.uid()));
create policy "published lessons readable" on public.lesson_catalog for select to authenticated using (review_status='published');
create policy "published lesson rules readable" on public.lesson_rules for select to authenticated using (exists(select 1 from public.lesson_catalog l where l.id=lesson_id and l.review_status='published'));
create policy "lesson progress own" on public.lesson_progress for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit) values
 ('lesson-assets','lesson-assets',false,104857600),('avatars','avatars',false,10485760)
on conflict(id) do nothing;

create policy "users delete own uploads" on storage.objects for delete to authenticated using (bucket_id='song-uploads' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "users delete own results" on storage.objects for delete to authenticated using (bucket_id='analysis-results' and (storage.foldername(name))[1]=(select auth.uid())::text);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.analysis_jobs for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lesson_catalog for each row execute function public.set_updated_at();
create trigger lesson_progress_updated_at before update on public.lesson_progress for each row execute function public.set_updated_at();
