# Webhook Reference

Provider webhooks are untrusted until authenticity is verified.

Required order:
1. receive request in provider-required raw form
2. verify signature/authenticity
3. parse trusted event
4. derive stable event identity
5. atomically claim/check idempotency key
6. apply state transition
7. persist processing result
8. return provider-appropriate status

Test valid signature, invalid/missing signature, duplicate event, retry after success/failure, unknown event type, malformed body, and out-of-order behavior when relevant.

"The handler is fast" is not idempotency.
