# Audit log and export

Two logging layers exist: **operation logs** (technical) and **audit events** (security/compliance).

## Audit events

Written to `audit_event` table. Examples:

| Action | When |
|--------|------|
| `LOGIN` | User session created |
| `LOGOUT` | Session deleted |
| `CONFIG_EXPORT` | Server configuration exported (after password re-entry) |

View on **Operations history** → **Audit** tab.

## Operation logs

Written for long-running work: apply, refresh, install, port scan, etc. Includes step metadata and success/failure messages.

View on **Operations history** → **Operations** tab or the live **operation banner**.

## Config export audit trail

Every successful export creates a `CONFIG_EXPORT` audit record with user ID and timestamp. Use this to trace who downloaded plaintext credential files.

## Retention

Snapshot retention keeps the last **10** snapshots per server (automatic purge of older). Operation log retention may be cleared manually from the UI.

Plan backup policy for audit data if compliance requires long retention — see [Backup and restore](../operations/backup-restore.md).

## Related docs

- [Import and export config](../concepts/import-export-config.md)
- [Operations history](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
