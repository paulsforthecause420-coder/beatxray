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

alter table public.analysis_jobs drop constraint if exists analysis_jobs_status_check;
alter table public.analysis_jobs add constraint analysis_jobs_status_check check (
  status in (
    'created','uploading','queued','preprocessing','separating','analyzing_rhythm',
    'analyzing_harmony','analyzing_effects','mastering_analysis','transcribing',
    'educational_analysis','packaging','complete','failed','cancelled'
  )
);
