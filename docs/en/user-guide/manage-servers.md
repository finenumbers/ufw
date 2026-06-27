# Manage servers

This guide walks through server lifecycle: add, configure UFW, refresh, edit, and delete.

## Prerequisites

Create at least one [SSH identity](../concepts/ssh-identities.md) before adding a server.

## Add a server

1. Sidebar → **Servers** or click **Add Server**
2. Fill in name, host, port, and select an identity
3. Click **Create Server** — SSH connection is verified automatically on submit
4. On success, you land on the server dashboard

If verification fails, check host reachability, credentials, firewall allowing SSH from the Docker host, and [host validation](../concepts/servers-and-ssh.md).

## Server dashboard

The dashboard loads **cached UFW state** from the latest Postgres snapshot — no SSH on first paint. Port scan and Docker panels also load the latest cached results from Postgres when available.

| Status | Actions available |
|--------|-------------------|
| UFW not installed | **Refresh Status**, then **Install UFW** (after refresh confirms UFW is missing) |
| Installed but inactive | **Refresh Status** only — UFW is already installed; use refresh to detect active/inactive state |
| Installed and active | **Add Rule**, **Save rules**, **Refresh Status** |

Click **Refresh Status** first to verify SSH and detect whether UFW is installed. **Install UFW** stays disabled until a successful refresh shows UFW is missing.

Until you run **Refresh Status**, the UFW badge may show a **cached** active/inactive label from the last snapshot.

Use **Refresh Status** to pull the latest UFW state over SSH and sync the rules table. If you have unsaved rule edits, the app asks for confirmation before reloading from the server.

If the app has **no UFW snapshot yet** in Postgres (new server, never refreshed, etc.), an automatic background sync runs once to populate the cache.

## Rule counts

Two different counters appear in the UI:

| Location | Label | Meaning |
|----------|-------|---------|
| **Servers list** card | saved rules | Count of rules stored in local metadata (`ruleRecord`) |
| **Dashboard** badge under Add Rule | in table | Count of rows in the rules table (active draft session) |

These numbers can differ while you edit, sync, or import rules. The dashboard badge matches the rules table total.

## Edit a server

1. Open server → **Edit**
2. Change name, host, port, or identity
3. SSH connection is verified automatically on submit when connection parameters changed

The edit page shows the stored host key fingerprint and an **unverified** warning when applicable — it does not have a separate test button.

## Delete a server

**Danger zone** on edit page or server settings:

- Deletes all local rules, drafts, snapshots for this server
- Does **not** modify remote UFW

Confirm only if you intend to remove management data, not to clear remote firewall rules.

## Servers list tools

From the main servers page you can:

- **Save configuration** / **Load configuration** — full JSON export/import (see [Import and export config](../concepts/import-export-config.md))

## Related docs

- [Servers and SSH](../concepts/servers-and-ssh.md)
- [Edit and apply rules](./edit-and-apply-rules.md)
