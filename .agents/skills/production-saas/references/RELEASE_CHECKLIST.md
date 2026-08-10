# Release Checklist

Mark every item PASS, FAIL, UNVERIFIED, or N/A.

## Foundation
- schema/migrations verified
- authentication verified
- authorization and cross-user/tenant isolation verified
- production secrets configured safely

## Application
- critical customer workflow succeeds end-to-end
- validation/error path verified
- no accidental production-path mock dependency

## APIs
- protected APIs authenticate and authorize
- invalid input handled
- controlled failures

## Webhooks, if applicable
- authenticity verified
- invalid signature rejected
- duplicate safe
- provider test/reconciliation verified

## Billing, if applicable
- active entitlement works
- inactive entitlement denied
- cancellation/revocation verified
- client cannot forge paid access

## Quality
- typecheck
- lint
- automated tests
- integration tests
- production build

## Deployment
- production deployment exists
- production environment correct
- production smoke test
- runtime logs checked

## Mobile, if applicable
- production release build/signing
- production endpoints
- installed/test-track smoke test
- billing/restore test if applicable

## Security/operations
- adversarial audit run
- no unresolved CRITICAL finding
- no unresolved HIGH release blocker
- rollback/forward-fix plan
- human-only blockers recorded

READY requires every applicable critical gate to PASS.
