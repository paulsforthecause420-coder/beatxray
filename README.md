# Beat >X< RAY
## SEE INSIDE THE BEAT
A product of the ZeroHype Organization.

Production-oriented MVP for secure audio upload, GPU stem separation, musical analysis, MIDI transcription, DAW-ready export packages, and a future subscription education platform.

## Start here

```bash
nvm use
npm ci
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

## Rebuild Supabase

```bash
supabase start
supabase db reset
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Verify repository

```bash
npm run check:env
npm run verify
```

Read `docs/runbooks/NEW_SUPABASE_PROJECT.md` before connecting a replacement project. The database schema, RLS policies, buckets, and worker contract must remain source-controlled.
