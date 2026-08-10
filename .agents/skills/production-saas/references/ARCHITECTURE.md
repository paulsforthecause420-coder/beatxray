# Architecture Reference

Prefer explicit trust boundaries.

Typical customer path:
Client → authenticated server/API → business logic → database/trusted provider.

Typical provider path:
Provider → verified webhook → idempotent event handler → persistent trusted state.

For each important datum identify its source of truth, allowed writers/readers, and reconciliation mechanism. High-risk examples: subscription status, tenant membership, role/permission, payment status, ownership, and account state.

Design explicit behavior for database/provider outage, network timeout, duplicate request, partial write, stale state, expired auth, and retry after uncertain outcome.
