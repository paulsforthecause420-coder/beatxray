# Beat >X< RAY System Architecture

Browser uploads directly to private Supabase Storage. The Next.js server creates an idempotent analysis job and signs a request to Modal. Modal preprocesses audio, separates stems, runs specialized analyzers, packages results, uploads durable artifacts, and updates job status. The web application reads only user-owned rows and objects through RLS.

## Claims boundary
Effects, techniques, chords, sections, and production decisions are estimates from rendered audio. Every inferred result must include confidence and evidence. BeatXray never claims to recover an original plugin chain or session.
