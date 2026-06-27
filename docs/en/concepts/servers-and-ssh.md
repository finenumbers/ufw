# Servers and SSH

A **server** record represents one Linux host you manage. The app connects over SSH to run UFW commands and read firewall state.

## Server fields

| Field | Purpose |
|-------|---------|
| **Name** | Display label in the sidebar |
| **Host** | IP address or DNS name (validated before save) |
| **Port** | SSH port (default 22) |
| **SSH identity** | Credentials used for connection |

## Host validation (SSRF protection)

Before a server is saved, the host is validated:

- Private IP ranges (10.x, 172.16–31, 192.168.x) are **blocked** by default
- Link-local and cloud metadata addresses are blocked
- IPv4-mapped IPv6 private addresses are blocked
- Optional allowlist: set `SSH_ALLOWED_CIDRS` in `.env` (e.g. `10.0.0.0/8`) for internal networks

This prevents the application from being abused as a proxy to scan internal networks.

## DNS resolution check

Validation happens in two stages:

1. **At save** — the hostname string is checked (private literals, metadata hosts, optional CIDR allowlist).
2. **Before connect** — the hostname is resolved to an IP and the **resolved address** is checked with the same rules.

This closes DNS rebinding gaps where a public hostname later resolves to a private or metadata IP.

## SSH verification on save

Creating or updating a server (host, port, or identity change) runs an **SSH connection test automatically on submit**. There is no separate test button — save is blocked until verification passes.

On first successful verification, the host key fingerprint is stored and the server is marked **verified**.

## SSH host key pinning

| State | Meaning |
|-------|---------|
| **Verified** | Key recorded after successful create/update save or **Refresh Status** |
| **Unverified** | Key imported from configuration — run **Refresh Status** on the server dashboard to verify |

The edit page shows the fingerprint and an unverified warning but does not run verification until you save changed connection settings or use **Refresh Status** on the dashboard.

If the remote host key changes (reinstall, MITM), the next connection fails until you investigate.

## What deleting a server does

Deleting a server removes **local** data only:

- Draft rules, snapshots, apply sessions, operation history for that server

It does **not** change UFW rules on the remote Linux host. Remote firewall state remains as-is.

## UFW lifecycle on a server

From the server dashboard you can:

1. **Refresh Status** — detect whether UFW is installed and active (uses cached snapshot until refresh)
2. **Install UFW** if missing — install and enable run together in one operation
3. Edit and apply rules when UFW is installed **and** active

Rules editing is available only when UFW is installed **and** active.

## Related docs

- [SSH identities](./ssh-identities.md)
- [Manage servers](../user-guide/manage-servers.md)
- [Troubleshooting](../troubleshooting.md)
