# Servers and SSH

A **server** record stores display name, host, port, SSH identity, and optional host key fingerprint. All remote UFW work goes through this record.

## Host validation

Before save, the app validates the target host:

| Check | Default behaviour |
|-------|-------------------|
| Private IP ranges | **Rejected** (RFC1918, loopback, link-local) |
| Cloud metadata IPs | **Rejected** |
| Public hostnames / IPs | Allowed |
| Custom allowlist | Set `SSH_ALLOWED_CIDRS` to permit specific private ranges (lab/VPN) |

DNS resolution is validated where applicable so typos fail early.

## Connection verification

**Create Server** and **Edit Server** (when host, port, or identity change) run an SSH connection test automatically. There is no separate *Test connection* button on the edit form.

Failure messages point to reachability, credentials, firewall, or host validation — see [Troubleshooting](../troubleshooting.md).

## SSH host keys (trust on first use)

On first successful connection, the server host key fingerprint is stored and marked **verified**.

| State | UI | Apply rules |
|-------|-----|-------------|
| **Verified** | Fingerprint shown on edit page | Allowed after refresh |
| **Unverified** | Warning on dashboard and edit page | **Save rules** (apply) blocked until **Refresh Status** succeeds |

This reduces MITM risk on first connect. To trust a new key after server rebuild, update the server or clear and re-verify via refresh.

Imported servers from configuration may arrive with stored fingerprints — verify with **Refresh Status** before applying rules.

## Sudo and UFW

Remote commands assume the SSH user can run `ufw` — typically via passwordless sudo for `ufw` or root. The app wraps apt install commands in `sudo` where needed for **Install UFW**.

Ensure `/etc/sudoers` allows required commands for your chosen user.

## Duplicate servers

The same host + port + identity combination cannot be registered twice. Use distinct names if you intentionally manage the same host through different accounts (different identities).

## Related docs

- [SSH identities](./ssh-identities.md)
- [Manage servers](../user-guide/manage-servers.md)
- [Environment variables](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
