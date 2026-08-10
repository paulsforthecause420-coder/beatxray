---
name: production-saas
description: Build, integrate, repair, verify, deploy, and release production SaaS applications across frontend, backend, database, authentication, APIs, webhooks, billing, mobile, testing, and deployment. Use when the user wants working production software rather than a prototype or isolated code.
---

# Production SaaS Orchestrator

Read `AGENTS.md` and `PLANS.md` first. Load only reference files relevant to the current task.

## Principle

A feature is not complete because code exists. Completion requires executable evidence that the real dependency path behaves correctly.

## Phase 1 — Discover

Inspect repository structure, manifests, runtime/frameworks, environments, frontend/backend entry points, database/schema/migrations, auth/authorization, external services, webhooks, billing, mobile config, CI, deployment, tests, and connected MCP tools.

Use `saas_architect` for independent read-only mapping when useful. Update `docs/implementation-plan.md`. For complex work create an ExecPlan following `PLANS.md`.

## Phase 2 — Foundation

Verify database reachability, deployed schema/migrations, constraints/indexes, authentication, authorization, user/tenant isolation, and required environment configuration before dependent feature work.

## Phase 3 — Vertical slices

Implement customer workflows end-to-end:
user action → UI → authentication → server/API → business logic → database/provider → persistent state → response → UI.

Remove production-path mock data once real test/development dependencies are accessible.

## Phase 4 — External services

For each service verify server-side credentials, perform a safe real test request when possible, validate success/error behavior, inspect timeout/retry handling, and avoid secret leakage in logs.

## Phase 5 — Webhooks

Read `references/WEBHOOKS.md`. Every webhook requires authenticity verification and idempotency.

## Phase 6 — Billing

Read `references/BILLING.md`. Trusted provider/backend state is authoritative for protected access.

## Phase 7 — Quality gate

Run all applicable typecheck, lint, unit, integration, authorization/isolation, API, webhook, billing, build, and E2E/smoke tests. Fix failures and rerun.

## Phase 8 — Deploy

Deploy applicable services, then verify the deployed system itself: environment, auth, critical read/write workflow, APIs, logs, webhook reachability, billing/entitlements, and production endpoints.

## Phase 9 — Mobile/Android

When applicable follow `references/ANDROID.md`. Source code or a dev build is not store-ready evidence.

## Phase 10 — Adversarial review

Before final release invoke `$production-auditor` or spawn `production_auditor`. Resolve confirmed CRITICAL/HIGH issues and add regression coverage.

## Phase 11 — Evidence and release

Follow `references/EVIDENCE_STANDARD.md` and `references/RELEASE_CHECKLIST.md`. Update `docs/release-evidence.md`, run `python scripts/release-gate.py`, then have `release_verifier` independently assess evidence.

Final result must be READY or NOT READY.
