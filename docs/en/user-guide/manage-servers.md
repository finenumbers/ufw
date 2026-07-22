# Manage servers

This guide covers server lifecycle: add, dashboard, refresh, install UFW, edit, delete, and list statistics.

## Prerequisites

Create at least one [SSH identity](../concepts/ssh-identities.md) before adding a server.

## Add a server

1. Sidebar → **Servers** → **Add Server**
2. Fill name, host, port, select identity
3. **Create Server** — SSH verified automatically on submit
4. On success, open the server dashboard

If verification fails, check host reachability, credentials, firewall allowing SSH from the Docker host, and [host validation](../concepts/servers-and-ssh.md).

## Server dashboard

The dashboard loads **cached UFW state** from the latest Postgres snapshot — no SSH on first paint.

When port scan is enabled, the scan panel loads the **latest scan of any status** from Postgres (including in-progress scans since v0.9.2).

| UFW status | Actions |
|------------|---------|
| Not installed | **Refresh Status**, then **Install UFW** (after refresh confirms missing) |
| Installed but inactive | **Refresh Status** — install button hidden if UFW exists but inactive |
| Installed and active | **Add Rule**, **Save rules**, **Refresh Status**, optional **Scan ports** |

**Refresh Status** runs live SSH, updates snapshot, and syncs the rules table. **Install UFW** stays disabled until refresh confirms UFW is not installed.

Until refresh, the UFW badge may show a **cached** label from the last snapshot.

### Unsaved edits warning

If you have unsaved draft changes, refresh asks for confirmation before reloading from the server.

### Automatic initial sync

When **no UFW snapshot exists** in Postgres (new server, never refreshed), a background sync operation runs once to populate the cache. Watch the operation banner.

## Rule and port statistics

| Location | Metric | Meaning |
|----------|--------|---------|
| **Servers list** card | saved rules | Local `ruleRecord` count |
| **Servers list** card | open ports | Latest successful scan findings (when enabled) |
| **Dashboard** badge | in table | Visible rules table row count |

Dashboard *in table* can differ from *saved rules* while editing or before apply.

## Edit a server

1. Server page → **Edit**
2. Change name, host, port, or identity
3. SSH verified on submit when connection parameters changed

Edit page shows host key fingerprint and **unverified** warning when applicable.

## Delete a server

**Danger zone** on edit page:

- Removes local rules, drafts, snapshots, scans for this server
- Does **not** change remote UFW

Confirm only when removing management data, not when clearing remote firewall rules.

## Servers list configuration tools

- **Save configuration** / **Load configuration** — full JSON v2 export/import — see [Import and export config](../concepts/import-export-config.md)

## Related docs

- [Servers and SSH](../concepts/servers-and-ssh.md)
- [Edit and apply rules](./edit-and-apply-rules.md)
- [Port scan](./port-scan.md)
