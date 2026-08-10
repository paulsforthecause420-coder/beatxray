# Production SaaS Repository Instructions

## Mission

Deliver working, secure, verifiable production software.

Code presence is not evidence of functionality. A feature is complete only when the applicable dependency chain has been executed and verified.

Examples:
- UI exists != workflow works.
- migration file exists != migration ran.
- API route exists != API is reachable and authorized.
- webhook handler exists != provider delivery is valid.
- payment code exists != purchase/entitlement works.
- deployment success != production workflow works.

## Required workflow

For every significant feature or repair:
1. Inspect the current implementation.
2. Trace dependencies and trust boundaries.
3. Define executable acceptance criteria.
4. Use an ExecPlan for complex work as defined by `PLANS.md`.
5. Implement the smallest complete vertical slice.
6. Run static checks.
7. Run automated tests.
8. Run integration tests against real development/test services when accessible.
9. Inspect logs and resulting persistent state.
10. Fix failures at the root cause.
11. Rerun the failed reproduction.
12. Run relevant regression tests.
13. Record evidence in `docs/release-evidence.md`.

## Skills

Use `$production-saas` when implementing, integrating, fixing, deploying, or preparing a SaaS release.
Use `$production-auditor` when challenging release readiness or security/integration correctness.

## Subagents

Preferred roles:
- `saas_architect`: read-only system/dependency mapping.
- `saas_builder`: implementation.
- `production_auditor`: read-only adversarial reviewer.
- `release_verifier`: read-only evidence verification.

Do not have multiple agents make overlapping edits simultaneously.

## Authorization and data

- Enforce authorization on the trusted server/database boundary.
- Test tenant/user isolation explicitly.
- Never trust client-supplied role, subscription, entitlement, price, ownership, or authorization claims.
- Never place service-role/server credentials in browser/mobile code.

## Secrets

Never commit or log live passwords, tokens, private keys, signing secrets, service-role credentials, or payment secrets.
Client-visible environment variables must be safe to publish.

## APIs

Every protected endpoint must authenticate, authorize, validate input, and return controlled errors.
Test allowed and denied paths.

## Webhooks

Every webhook must verify provider authenticity before trusting the payload, be idempotent, deduplicate stable event identities, tolerate retries, and avoid destructive double application.
Test valid, invalid-signature, and duplicate delivery paths.

## Billing

Trusted backend/provider state is authoritative. The UI may display subscription state but cannot grant protected access from local state.

## Frontend

Critical workflows need loading, success, validation, error, and recovery behavior.
No production workflow may depend on placeholder/mock data once the real dependency is available.

## Testing

Run all applicable: typecheck, lint, unit tests, integration tests, authorization/isolation tests, webhook tests, billing tests, build, and production smoke tests.
A skipped critical test is UNVERIFIED, not PASS.

## Deployment

After deployment, test the deployed environment itself: environment selection, auth, core read/write workflow, critical APIs, webhook reachability, billing/entitlements, production URLs, and logs.

## Mobile/Android

When applicable verify package ID, version/versionCode, permissions, signing, production endpoints, auth, billing, release build, and installed/test-track behavior.

## Release gate

Final decision is binary: READY or NOT READY.

Before release:
1. run `$production-auditor`
2. resolve confirmed critical/high findings
3. have `release_verifier` inspect evidence
4. run `python scripts/release-gate.py`

Never downgrade missing evidence into a pass.
