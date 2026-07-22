# FAQ

## General

### What is UFW Remote Manager?

A self-hosted web app to manage UFW firewalls on remote Linux servers over SSH, with draft/apply workflow and audit trail.

### Does it replace Nginx Proxy Manager?

No. NPM (or similar) terminates HTTPS for the admin UI. UFW Remote Manager manages **remote server firewalls**, not your reverse proxy.

### Can I manage remote containers?

No. Remote container inventory was **removed in v0.9.0**. The app manages UFW rules and optional external port scans only.

### How many admin users?

One account after initial `/setup`. No multi-user UI.

### Can I run multiple app replicas?

Not recommended. Rate limits and queues are in-memory (single replica design).

## SSH and servers

### Why is private IP rejected?

Default security — blocks RFC1918 and metadata addresses. Set `SSH_ALLOWED_CIDRS` for lab/VPN targets.

### Why is apply disabled?

SSH host key may be **unverified**. Run **Refresh Status** successfully first.

### Does delete server change remote UFW?

No. Delete removes local management data only.

## Rules and apply

### Preview vs confirm?

Preview shows planned changes without executing. Confirm runs UFW commands over SSH.

### Remote changed since preview?

Apply rejected — run **Apply preview** again. Do not force resync for this case.

### Partial apply?

See [Draft and apply workflow](./concepts/draft-apply-workflow.md). Use **Force resync from server** when indicated.

### Why do rule counts differ?

**Saved rules** (list card) vs **in table** (dashboard) count different things — see [UFW rules and states](./concepts/ufw-rules-and-states.md).

## Operations UI

### Banner stuck on RUNNING?

Refresh page. Sweeper clears stale operations within ~30–60 minutes.

### Rules not updating after sync?

Since v0.9.2, operation end should trigger page refresh. Try manual browser refresh once.

## Port scan

### Scan button missing?

`PORT_SCAN_ENABLED` not set to `true` in app environment.

### Scan already running?

Only one active scan per server. Wait or check operations history.

### Does scan block UFW refresh?

No (since v0.9.2). Scan runs outside SSH queue.

## Deployment

### Where run migrations?

In **migrate** / **ufw-migrate** container — not inside **ufw-app**. See [Deployment overview](./deployment/overview.md).

### EACCES running prisma in app container?

Expected — use `docker compose run --rm migrate`.

## Related docs

- [Troubleshooting](./troubleshooting.md)
- [Introduction](./introduction.md)
