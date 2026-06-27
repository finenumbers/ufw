# Import and export configuration

You can export and import a **full server configuration** (all servers, identities, rules metadata) as JSON **v2**.

## Export

1. From the **Servers** page, use **Save configuration**
2. Re-enter your **account password** (step-up authentication)
3. Download JSON file

### Important security warning

The export file contains **plaintext SSH passwords and private keys**. Treat it like a secret:

- Store encrypted (password manager vault, encrypted disk)
- Never commit to git or send over unsecured channels
- A `CONFIG_EXPORT` audit event is written when export succeeds

## Import

1. Use **Load configuration** on the Servers page
2. Select JSON v2 file
3. Review the summary: servers to create, update, delete
4. Confirm — import runs in a transaction (upsert first, delete last)

### Destructive behavior

Servers **missing** from the import file can be **deleted** along with all their rules and snapshots. Read the confirmation dialog carefully.

Imported SSH host keys may be marked **unverified** until you run SSH test on each server.

### Import limits

- Rule imports (CSV, XLSX, JSON) are capped at **10 000 rows** per file.
- Config import **preview** is rate-limited to **10 attempts per minute** per user — wait and retry if you hit the limit.

## Export vs Postgres backup

| Method | Contains | Best for |
|--------|----------|----------|
| **Config export (JSON)** | Human-readable config + plaintext secrets | Migration between instances, disaster copy |
| **Postgres dump** | Full database including encrypted secrets | Complete restore with same `APP_ENCRYPTION_KEY` |
| **`.env` backup** | Runtime secrets | Required to decrypt DB credentials after restore |

For full disaster recovery, back up **both** Postgres and `.env` — see [Backup and restore](../operations/backup-restore.md).

## Related docs

- [Audit log and export](../administration/audit-log-and-export.md)
- [SSH identities](./ssh-identities.md)
