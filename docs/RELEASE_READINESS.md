# BeatXray Release Readiness Record

**Product:** Beat >X< Ray — *SEE INSIDE THE BEAT*

**Organization:** ZeroHype Organization

**Repository:** `paulsforthecause420-coder/beatxray`

**Assessment date:** August 15, 2026
**Release state:** **Code and local verification complete; external production activation remains gated.**

## Release Summary

This release converts the initial BeatXray foundation into a substantially more production-oriented codebase. The web application now creates idempotent jobs only after validating private upload metadata, records dispatch and processing events, enforces server-side plan limits, provides retry/cancel/delete controls, and exposes a no-store health probe. The worker is now structured as a CPU coordinator with a dedicated GPU stem-separation function, durable stage artifacts, event records, resumable processing, and a deployed-image runtime compatibility check.

> **Important:** This record does not represent a live-production declaration. No real Supabase, Modal, Stripe, Vercel, or DNS environment was available in this workspace. The external verification and account-owner actions listed below remain mandatory before launch.

| Area | Delivered in the codebase | Verification state |
|---|---|---|
| Dependency security | Next.js upgraded to `16.3.1`; remediated lockfile resolves patched PostCSS, Sharp, and NanoID lines. | `npm audit --package-lock-only --omit=dev --audit-level=high` reports **0 vulnerabilities**. |
| Worker compatibility | Python 3.11 image, `numpy==1.26.4`, `tensorflow==2.14.1`, Basic Pitch 0.4.0, and Demucs 4.0.1 are pinned. | Static regression tests pass. The deployed Modal image still requires a real runtime-check invocation. |
| GPU cost control | Only `separate_stems_on_gpu` requests an L4 GPU. The coordinator, analysis, transcription, database updates, and packaging run as CPU work. | Code review and worker contract tests pass; runtime measurement requires a real job. |
| Checkpointing | Analysis JSON, stems, MIDI, education JSON, and final export are private artifacts with database records. The worker reuses valid artifacts. | Worker source and migration contract tests pass; real recovery simulation is pending Supabase and Modal access. |
| Upload controls | The API validates user-owned object paths, object existence, stored size, stored MIME type, and a UUID idempotency key. | Lint and production build pass. Requires a real storage upload/RLS test. |
| Billing | Hosted Stripe Checkout, customer portal, signed webhook verification, subscription synchronization, and monthly usage ledger enforcement are implemented. | Build passes. Sandbox Stripe product IDs, webhook secret, and event tests are pending. |
| User controls | Dashboard provides result download, retry, cancellation, and confirmed deletion for terminal jobs. | Build passes. Real RLS and deletion smoke test is pending. |
| Product notices | Public Terms and Privacy pages, landing-page educational-use notice, and upload authorization confirmation are included. | Content is intentionally marked for legal approval and needs final business details. |
| Observability | `analysis_events`, `webhook_events`, durable artifacts, a health endpoint, and `check:worker-runtime` command are included. | Local health probe correctly reports `503 degraded` without secrets. Production health probe must return `200 ok`. |

## Local Verification Evidence

| Check | Result | Notes |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed | Clean installation succeeded from the regenerated lockfile. |
| `npm run lint` | Passed | ESLint completed with no reported errors. |
| `npm run build` | Passed | Next.js 16.3.1 production build compiled all 13 routes. |
| `python3 -m pytest services/worker/tests -q` | Passed | Five tests passed: webhook header contract, worker dependency/runtime contract, and Demucs success/failure behavior. |
| `python3 -m compileall -q services/worker` | Passed | Worker source is syntactically valid in the local Python environment. |
| `npm audit --package-lock-only --omit=dev --audit-level=high` | Passed | Zero high or critical production dependency advisories reported. |
| Local production server smoke test | Passed with expected degraded health | `/`, `/terms`, and `/privacy` returned HTTP 200. The configured security headers were present. `/api/health` returned HTTP 503 because service secrets were deliberately absent. |
| `git diff --check` | Passed | No whitespace errors reported. |

## Production Configuration Inventory

Set these values only in the relevant provider’s encrypted environment configuration. Do not commit them or expose them in browser-visible variables.

| Service | Required configuration | Purpose |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Browser authentication/storage access and server-only privileged job/billing mutations. |
| Modal and Vercel | `WORKER_WEBHOOK_URL`, `WORKER_WEBHOOK_SECRET` | Authenticated handoff from the web application to the Modal worker. The secret must match in both services. |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` | Server-only subscription Checkout, customer portal, webhook signature verification, and price selection. |
| Product limits | `BEATXRAY_FREE_MONTHLY_JOB_LIMIT`, `BEATXRAY_STARTER_MONTHLY_JOB_LIMIT`, `BEATXRAY_PRO_MONTHLY_JOB_LIMIT` | Server-enforced monthly analysis reservations. Confirm owner-approved values before deployment. |
| Public origin | `NEXT_PUBLIC_SITE_URL=https://beatxray.com` | Checkout success/cancel redirects and customer-portal return URL. |

## Deployment Runbook

### 1. Apply the database migrations

Run the repository migrations in a staging Supabase project first, then production after verification. The new `003_checkpointed_jobs.sql` migration adds the `educational_analysis` stage and protects the invariant of one artifact record per job/type.

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

Confirm that the private `song-uploads` and `analysis-results` buckets remain non-public, that user-scoped policies are intact, and that the new tables (`analysis_events`, `artifacts`, `analysis_results`, `subscriptions`, `usage_ledger`, `webhook_events`, and `audit_log`) exist with Row Level Security enabled.

### 2. Configure and validate the Modal worker

Set the secret named `beatxray-secrets` in Modal with `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `WORKER_WEBHOOK_SECRET`. Deploy the worker, then run the remote sanity check:

```bash
npm run check:worker-runtime
```

This must report Python 3.11, NumPy 1.26.4, TensorFlow 2.14.1, and the expected audio-model versions before production jobs are enabled. Run one short, authorized staging audio upload and verify that the coordinator creates durable artifacts and that a retry reuses the completed stages rather than rerunning Demucs.

### 3. Configure Stripe in sandbox first

Create owner-approved sandbox Products and recurring Prices, then add their IDs as `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO`. Configure the customer portal and register the public HTTPS webhook endpoint:

```text
https://<staging-domain>/api/billing/webhook
```

Subscribe the endpoint to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. The webhook must use its unique signing secret; the handler verifies the raw body and `Stripe-Signature` before recording any state. Stripe’s documentation recommends hosted Checkout for subscriptions, a stored customer ID for portal sessions, and webhook-based fulfillment rather than trusting browser redirects.[1] [2] [3]

### 4. Deploy the web application

Deploy the `apps/web` workspace to the authorized hosting project with the production variables above. Attach `beatxray.com` only after the staging check passes and the domain’s required DNS records are confirmed in the hosting provider. Verify:

```text
GET https://beatxray.com/api/health -> 200 {"status":"ok", ...}
GET https://beatxray.com/terms -> 200
GET https://beatxray.com/privacy -> 200
```

The build includes HSTS, frame-denial, MIME-sniffing protection, referrer policy, permissions policy, cross-origin isolation headers, and a restrictive same-origin content policy.

### 5. Execute production acceptance tests

Use two separate test accounts and an authorized short audio file. Verify all of the following in staging before production:

| Scenario | Expected outcome |
|---|---|
| Account A upload | Account A can create an idempotent job and sees progress/status. |
| Account B isolation | Account B cannot list, download, retry, cancel, or delete Account A’s jobs or objects. |
| Worker processing | Artifacts, event records, and final ZIP are private and associated with the correct job. |
| Resume behavior | A controlled late-stage failure followed by retry retains validated analysis/stem artifacts and does not repeat separation. |
| Failure behavior | A malformed/unsupported audio file fails with an internal error code and user-safe message; no raw secret or traceback is exposed. |
| Job cancellation | Cancelling an active job prevents the next worker stage; terminal job deletion removes source, artifacts, and records. |
| Billing | Stripe sandbox Checkout activates the configured plan only after a verified webhook; portal session opens for the matching customer; cancellation/update events update plan access. |
| Usage limit | A job at the configured monthly limit is rejected server-side even if the browser UI is bypassed. |
| Health | `/api/health` returns 200 with valid configuration and database access. |

## External Approval and Configuration Gates

| Gate | Required owner action | Why it remains blocked |
|---|---|---|
| Stripe account connection | Select and authorize either the available Stripe app or Stripe API connection, then provide or configure sandbox credentials and approved Products/Prices. | Two Stripe connection choices are available, but neither is enabled; selecting one without owner direction would be ambiguous. |
| Stripe live activation | Complete any required account claim, identity/KYC, bank, tax, and live-mode verification actions; explicitly approve activation. | These steps are account-owner controlled and can trigger financial obligations. |
| Modal runtime check and test job | Confirm the existing Modal project and permit an authorized staging job. | The sandbox has no Modal CLI/configuration. A remote invocation may consume provider resources. |
| Supabase migration and RLS validation | Authorize the target project connection and staging/production migration. | No Supabase CLI or project credentials are present in the workspace. |
| Hosting and domain | Authorize the Vercel project/domain connection and DNS changes for `beatxray.com`. | No Vercel CLI/configuration is present. Domain changes require the owner’s authorized provider account. |
| Legal finalization | Provide approved legal contact, business address, governing law, retention/deletion policy, jurisdictional disclosures, and final counsel review. | The repository lacked the business-specific details needed for final public legal terms. |
| Plan policy | Confirm plan names, monthly analysis limits, prices, trial policy, tax behavior, and refund/support policy. | Defaults are implementation safeguards, not approved commercial promises. |

## Release Decision

**Do not label BeatXray production-complete or turn on live billing yet.** The codebase has passed local build, security-audit, static worker, and public-route smoke checks. Its remaining blockers are account-specific external integration tests, owner approvals, final legal/commercial policy, and staging-to-production deployment verification.

## References

[1]: https://docs.stripe.com/billing/quickstart "Stripe: Build a pre-built subscription page with Stripe Checkout"
[2]: https://docs.stripe.com/customer-management "Stripe: Provide a customer portal to your customers"
[3]: https://docs.stripe.com/webhooks "Stripe: Receive Stripe events in your webhook endpoint"
