# Database and Authorization Reference

Verify the actual deployed schema, not only ORM/types.

Check migrations, primary/foreign keys, unique/non-null constraints, indexes, delete/cascade behavior, timestamps/time zones, ownership/tenant fields, row-level/data authorization, and privileged access paths.

For multi-user systems use at least two independent identities A and B and verify A can access A's allowed records but cannot read, modify, or delete B's private records. Verify anonymous behavior and any privileged server path separately.

Never compensate for failed database authorization with client-side filtering.
