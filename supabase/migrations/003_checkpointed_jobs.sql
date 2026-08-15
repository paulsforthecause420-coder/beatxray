-- Keep the database stage state aligned with the checkpointed worker.
alter table public.analysis_jobs drop constraint if exists analysis_jobs_status_check;
alter table public.analysis_jobs add constraint analysis_jobs_status_check check (
  status in (
    'created', 'uploading', 'queued', 'preprocessing', 'separating',
    'analyzing_rhythm', 'analyzing_harmony', 'analyzing_effects',
    'transcribing', 'educational_analysis', 'packaging', 'complete',
    'failed', 'cancelled'
  )
);

create unique index if not exists artifacts_job_type_unique_idx
  on public.artifacts(job_id, type);

create index if not exists analysis_events_job_created_at_idx
  on public.analysis_events(job_id, created_at desc);

create index if not exists analysis_jobs_user_status_created_at_idx
  on public.analysis_jobs(user_id, status, created_at desc);
