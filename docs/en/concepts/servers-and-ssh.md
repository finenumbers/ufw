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

## SSH test before save

Creating or updating a server (host, port, or identity change) requires a successful **SSH connection test**. The UI blocks save until the test passes.

## SSH host key pinning

On first successful connection, the server’s SSH host key fingerprint is stored.

| State | Meaning |
|-------|---------|
| **Verified** | Key recorded after successful SSH test or normal operation |
| **Unverified** | Key imported from configuration file — run SSH test to verify |

If the remote host key changes (reinstall, MITM), the next connection fails until you investigate.

## What deleting a server does

Deleting a server removes **local** data only:

- Draft rules, snapshots, apply sessions, operation history for that server

It does **not** change UFW rules on the remote Linux host. Remote firewall state remains as-is.

## UFW lifecycle on a server

From the server dashboard you can:

1. **Detect** UFW — installed? active?
2. **Install** UFW if missing
3. **Enable** UFW and sync rules

Rules editing is available only when UFW is installed **and** active.

## Related docs

- [SSH identities](./ssh-identities.md)
- [Manage servers](../user-guide/manage-servers.md)
- [Troubleshooting](../troubleshooting.md)
