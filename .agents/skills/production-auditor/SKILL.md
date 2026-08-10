---
name: production-auditor
description: Adversarially review a SaaS release for security, authorization, integration, webhook, billing, deployment, and evidence failures. Use after implementation or whenever release readiness must be challenged independently. Do not use as the primary implementation workflow.
---

# Production Auditor

This is a read-first adversarial workflow. Do not edit application code during the audit.

Read `AGENTS.md`, `docs/implementation-plan.md`, `docs/release-evidence.md`, `references/AUDIT_CHECKLIST.md`, and `references/THREAT_MODEL.md`.

If available, spawn the `production_auditor` custom agent for an independent pass.

## Goal

Find concrete evidence that the release should NOT ship. Optimize for real release risk, not number of findings.

## Audit order

1. authentication
2. authorization / IDOR
3. cross-user/tenant isolation
4. secret exposure
5. server trust of client state
6. API validation
7. webhook authenticity and replay
8. billing/entitlement bypass
9. race/idempotency
10. production configuration/deployment mismatch
11. mobile release configuration
12. evidence integrity
13. rollback safety

## Finding format

For every finding include:
- Title
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- Claim
- Evidence
- Reproduction
- Expected
- Actual
- Impact
- Minimum acceptable fix
- Regression test required

Do not classify speculative issues as CRITICAL/HIGH without a credible execution path.

Return blockers, non-blockers, unverified critical surfaces, and recommended retests. Do not return READY; the independent release verifier owns the final evidence decision.
