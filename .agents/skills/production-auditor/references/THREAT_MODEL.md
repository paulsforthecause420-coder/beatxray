# Compact SaaS Threat Model

Assets: user/tenant data, credentials/tokens, payment/subscription state, privileged operations, uploads, provider credentials.

Attackers: anonymous user, low-privilege valid user, user from another tenant, malicious client controlling requests, webhook forger/replayer, compromised/stale session.

Trust boundaries:
- browser/mobile → server
- server → database
- server → provider
- provider → webhook
- CI/build → production
- mobile binary → backend

Never treat data crossing a trust boundary as authoritative without the appropriate authentication, authorization, validation, or authenticity mechanism.
