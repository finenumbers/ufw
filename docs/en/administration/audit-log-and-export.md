# Audit log and export

Two complementary trails: **operation logs** (task progress) and **audit events** (security and compliance).

## Audit events

Written to Postgres on sensitive actions. Examples:

| Action | When |
|--------|------|
| `LOGIN` / `LOGOUT` | Session start/end |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Apply workflow |
| `SNAPSHOT_LOADED` | UFW snapshot captured |
| `UFW_ENABLE` | Remote enable after install |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Port scan lifecycle |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | JSON v2 config transfer |
| Server CRUD | Create/update/delete server records |

View on **Operations history** → **Audit** tab with infinite scroll.

Audit retention follows database storage — no automatic purge unless operator clears history.

## Operation logs

Technical records with steps, status, timestamps, and error messages. See [Operations history](../user-guide/operations-history.md).

## Configuration export audit

Each successful **Save configuration** creates an audit entry. Export file contains **decrypted SSH secrets** — protect like a password vault dump.

Export flow:

1. Password confirmation (step-up)
2. Short-lived download token
3. JSON download via API route

Rate limit: 5 exports per minute per user.

## Clearing history

**Clear history** on operations page removes operation log entries per UI action. Does not roll back server changes or delete audit events in all cases — confirm dialog text for current behaviour.

Does not modify remote UFW or local rule drafts.

## Related docs

- [Import and export config](../concepts/import-export-config.md)
- [Security model](./security-model.md)
