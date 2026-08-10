# Adversarial Audit Checklist

## Identity/access
- anonymous protected access
- expired/invalid token behavior
- object ID changed to another user's record
- tenant ID changed client-side
- privileged fields mass-assigned
- client-supplied admin/role flags
- hidden UI mistaken for authorization

## Database/storage
- missing or broad row-level policy
- privileged credential exposed to client
- storage object isolation failure
- unsafe destructive cascade/delete

## APIs
- missing route/action authorization
- body/query/path ID trust
- internal error leakage
- missing input bounds

## Webhooks
- signature skipped or checked too late
- duplicate event double-applies
- event ID not claimed atomically
- retry/out-of-order corruption
- browser-originated request can mimic provider state change

## Billing
- client can set premium/plan/role
- protected endpoint trusts UI state
- cancel/revoke leaves access
- restore/account switch mixes identities
- replay corrupts entitlement/counters

## Deployment/evidence
- production frontend points to dev backend
- production backend points to test DB
- missing secrets create unsafe fallback
- stale deployment
- build-time/runtime env mismatch
- tests mock the critical provider
- auth tests use one identity only
- deployment claimed from CLI success alone
- evidence predates final code
