# Beat >X< RAY
## SEE INSIDE THE BEAT

BeatXray is an **audio intelligence engine and assisted audio mastering platform** from the ZeroHype Organization.

It turns authorized rendered audio into explainable production intelligence: stems, tempo, key, meter, arrangement, chord estimates, MIDI-ready transcription and DAW-oriented study packages. Its assisted-mastering layer measures technical conditions, identifies release risks and proposes a reversible starting chain that the creator controls.

> BeatXray provides estimates and mastering assistance. It does not recover an original production session, guarantee streaming-platform outcomes, or replace final checks with standards-compliant loudness and true-peak meters.

## Product workflows

- **Audio Intelligence** — inspect musical structure, rhythm, harmony, stems and reconstruction clues.
- **Mastering Assist** — inspect peaks, dynamics, clipping and stereo correlation; then receive an explainable mastering plan.
- **Complete X-Ray** — combine intelligence and mastering guidance in one job.

The initial mastering release produces recommendations only. Audio rendering will require explicit user approval and will preserve the original upload.

## Start here

```bash
nvm use
npm ci
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

## Worker tests

```bash
cd services/worker
python -m pytest
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

Architecture and safety contract: [docs/AUDIO_INTELLIGENCE_MASTERING.md](docs/AUDIO_INTELLIGENCE_MASTERING.md).

Read `docs/runbooks/NEW_SUPABASE_PROJECT.md` before connecting a replacement project. The database schema, RLS policies, storage buckets and worker contract must remain source-controlled.
