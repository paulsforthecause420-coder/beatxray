# Billing and Entitlement Reference

Client state is never the authority for paid access.

Verify the complete chain:
purchase → provider acceptance → provider event/reconciliation → backend subscription record → entitlement derivation → protected endpoint authorization → UI reflection.

Test active purchase, existing subscriber, cancellation/revocation, failed/overdue state where supported, duplicate event, stale client cache, forged client premium state, account switching, and restore/reconciliation when applicable.

Confirm current store/provider payment policies before release.
