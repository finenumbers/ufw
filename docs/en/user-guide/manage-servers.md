# Manage servers

This guide walks through server lifecycle: add, configure UFW, refresh, edit, and delete.

## Prerequisites

Create at least one [SSH identity](../concepts/ssh-identities.md) before adding a server.

## Add a server

1. Sidebar → **Servers** or click **Add Server**
2. Fill in name, host, port, and select an identity
3. Click **Create Server** — SSH test runs automatically
4. On success, you land on the server dashboard

If SSH test fails, check host reachability, credentials, firewall allowing SSH from the Docker host, and [host validation](../concepts/servers-and-ssh.md).

## Server dashboard

The dashboard loads **cached UFW state** from the latest Postgres snapshot — no SSH on first paint. This keeps the page fast.

| Status | Actions available |
|--------|-------------------|
| UFW not installed | **Refresh Status**, then **Install UFW** (if needed) |
| Installed but inactive | **Enable UFW** |
| Installed and active | **Rules**, **Refresh Status** |

Click **Refresh Status** first to verify SSH and detect whether UFW is installed. **Install UFW** stays disabled until a successful refresh shows UFW is missing.

Use **Refresh Status** to pull the latest UFW state over SSH and sync the rules table.

If UFW is active but the app has **no snapshot yet** (first visit after enable), an automatic background sync runs once to populate the cache.

## Edit a server

1. Open server → **Edit**
2. Change name, host, port, or identity
3. SSH test required before save if connection parameters changed

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
