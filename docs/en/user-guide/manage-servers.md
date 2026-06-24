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

The dashboard shows UFW status:

| Status | Actions available |
|--------|-------------------|
| UFW not installed | **Install UFW** |
| Installed but inactive | **Enable UFW** |
| Installed and active | **Rules**, refresh, SSH test |

Use **Refresh** to pull latest UFW state and sync the rules table.

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
