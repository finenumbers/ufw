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
| This Docker host | Set `SSH_ALLOW_DOCKER_HOST=true`, then use host `host.docker.internal` |

DNS resolution is validated where applicable so typos fail early.

`SSH_ALLOW_DOCKER_HOST` does not allow arbitrary private IPs. The app connects to the container's own default gateway, and only when that address is inside the container subnet. It does not use `docker0` (`172.17.0.1`) from another bridge, a container name, or a literal gateway typed into the form. Block-check does not query this name.

On the machine, allow TCP/22 from that container subnet only. The timeout message prints the exact command, for example `ufw allow from 172.21.0.0/16 to any port 22 proto tcp`. Do not open `172.16.0.0/12`. `sshd` must listen on `0.0.0.0`. The SSH user needs passwordless sudo for `ufw`.

Enabling UFW on this host, or denying the container subnet, can drop forwarding between the app network and Nginx Proxy Manager. The panel can disappear while SSH from the container still works. Keep console access before you enable UFW or tighten rules here.

## AmneziaWG

On create and edit, a node can connect through the single AmneziaWG tunnel. Nodes without that choice stay on the container's normal route. The tunnel is not the default route. If the tunnel is down, that node is not reached directly. A hostname is resolved by the container DNS, then only that IPv4 is routed into `awg0`. A name that exists only inside the VPN is entered as its internal IPv4 address. Changing only this choice keeps the stored SSH host key and checks it again.

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
