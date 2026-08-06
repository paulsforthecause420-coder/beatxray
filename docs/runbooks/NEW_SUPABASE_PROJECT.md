# Rebuild Supabase from Source

1. Create a new Supabase project.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and add the new URL and keys.
3. Run `supabase login` and `supabase link --project-ref <ref>`.
4. Run `supabase db push`.
5. Confirm the `song-uploads`, `analysis-results`, `lesson-assets`, and `avatars` buckets exist.
6. Run two-user isolation tests before connecting Modal.
7. Create or update the Modal secret using the new server-side Supabase key.
8. Deploy the worker and run one short test upload.

Never recreate schema or policies only in the dashboard. Commit every change as a migration.
