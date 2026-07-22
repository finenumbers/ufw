# Import and export config

Export and import a **JSON v2** file containing all servers, SSH identities (including decrypted secrets), and related metadata. Use for backup, migration, or disaster recovery — not for day-to-day rule editing.

Rule-level import/export (CSV, XLSX) is separate — see [Edit and apply rules](../user-guide/edit-and-apply-rules.md).

## Export flow

1. **Servers** list → **Save configuration**
2. Enter your account **password** (step-up authentication)
3. Download JSON file (`servers-config-YYYY-MM-DD.json`)

Export includes decrypted SSH secrets. Store the file encrypted at rest; delete when no longer needed.

A short-lived token gates the download API after password confirmation.

Rate limit: 5 exports per minute per user.

## Import flow

1. **Load configuration** → select JSON file
2. **Preview** shows diff: servers and identities to create, update, or delete
3. Confirm with password → import applies changes

Import waits for per-server queues to become idle and blocks if destructive operations would conflict with active work.

## JSON v2 format

| Section | Contents |
|---------|----------|
| **version** | `2` |
| **identities** | Name, username, auth method, secrets |
| **servers** | Name, host, port, identity reference, host key fields |

Legacy array-only or v1 files are rejected.

Duplicate keys (same host + port + identity) are rejected at parse time.

## Delete semantics on import

Servers present in the database but absent from the imported file appear in the preview **delete** set. Confirm only if you intend to remove those server records and all associated rules, drafts, and snapshots locally.

Remote UFW on deleted server records is **not** modified.

## Related docs

- [SSH identities](./ssh-identities.md)
- [Backup and restore](../operations/backup-restore.md)
- [Audit log and export](../administration/audit-log-and-export.md)
