-- Expand BeatXray jobs without breaking existing analysis sessions.
alter table public.analysis_jobs
  add column if not exists workflow text not null default 'intelligence'
    check (workflow in ('intelligence', 'mastering_assist', 'intelligence_and_mastering')),
  add column if not exists mastering_profile text not null default 'balanced'
    check (mastering_profile in ('balanced', 'streaming', 'loud', 'dynamic'));

comment on column public.analysis_jobs.workflow is
  'Requested audio-intelligence and/or assisted-mastering workflow.';
comment on column public.analysis_jobs.mastering_profile is
  'User-selected recommendation target; never implies guaranteed platform loudness.';
