# ADR-001: Platform split
Status: Accepted

BeatXray uses Next.js for the web application, Supabase for durable data/auth/private storage, and Modal for elastic Python/GPU processing. This separates web latency from long-running audio work and keeps temporary compute disposable.
