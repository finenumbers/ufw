# Security model

This page explains how UFW Remote Manager protects credentials, sessions, and network boundaries.

For vulnerability reporting, see [SECURITY.md](../../../SECURITY.md) (English, canonical).

## Authentication

- **Better Auth** with email/password
- Single admin account after initial setup — no public registration
- Session cookies; `BETTER_AUTH_SECRET` required in production
- Rate limiting on auth endpoints (in-memory, single replica)

## Credential encryption

SSH passwords and private keys are encrypted with **AES-256-GCM** before storage.

| Secret | Purpose |
|--------|---------|
| `APP_ENCRYPTION_KEY` | Encrypts/decrypts identity secrets (32 bytes, base64) |
| `BETTER_AUTH_SECRET` | Signs session tokens |

**If `APP_ENCRYPTION_KEY` is lost, encrypted SSH credentials cannot be recovered** — only re-entered manually or restored from config export backup.

## SSH security

- Host validation blocks SSRF to private/metadata addresses at save time
- **DNS resolution check:** before each SSH connect and port scan, the resolved IP is validated again — blocks DNS rebinding to private/metadata addresses even when the hostname looked safe at save time
- Optional `SSH_ALLOWED_CIDRS` for internal networks
- Host key pinning on first successful connection
- Imported keys marked unverified until SSH test succeeds
- Command injection prevented via allowlisted enums and sanitized UFW command building

## External port scanning (optional)

When `PORT_SCAN_ENABLED=true`:

- Scans run **only** toward `Server.host` records already in the database
- Naabu + Nmap execute inside `ufw-app` (connect scans, no arbitrary targets)
- Rate-limited per server; audit events recorded
- Requires **network egress** from the app container to managed hosts on scanned ports — see [Port scanning](../deployment/port-scan.md)

## Docker monitoring (optional)

When `DOCKER_MONITOR_ENABLED=true`:

- Inventory and control run over **SSH** on registered servers only
- Container references validated; only `START` / `STOP` / `RESTART` actions
- Rate limits and audit events on refresh and control
- SSH user needs Docker CLI access — see [Docker monitoring](../deployment/docker-monitor.md)

## Apply and export safeguards

- UFW changes require **preview + explicit confirm**
- Config export requires **password re-entry** and writes `CONFIG_EXPORT` audit event
- Export files contain **plaintext secrets** — operator responsibility

## HTTP security headers (production)

When `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS terminates at Nginx Proxy Manager; app receives HTTP on the Docker network.

### Content-Security-Policy note

The current CSP includes `'unsafe-inline'` and `'unsafe-eval'` for Next.js App Router scripts and hydration. Nonce-based CSP is deferred until Next.js supports it without breaking client bundles. Do not remove these directives without a full regression pass.

## Public endpoints

| Path | Auth | Notes |
|------|------|-------|
| `/api/health` | None | Returns `status`, `db`, `version`; `revision` (git/build id) only in non-production |
| `/setup` | None (once) | Rate-limited; use `TRUST_PROXY=1` behind NPM |

## Setup rate limiting

Initial admin registration (`/setup`) is limited to **5 attempts per minute** per client IP when `TRUST_PROXY=1`, otherwise per direct connection bucket.

## Network exposure checklist

- [ ] Admin UI only via HTTPS reverse proxy
- [ ] Postgres not exposed to host/internet in production
- [ ] Restrict admin URL (VPN, IP allowlist in NPM)
- [ ] Strong unique `.env` secrets
- [ ] Regular Postgres + `.env` backups off-host
- [ ] Rotate secrets if export or `.env` may have leaked

## Error sanitization

Client-facing errors from SSH/apply paths are sanitized to avoid leaking stack traces or internal paths.

Expired sessions return a consistent message from server actions: `Session expired. Please sign in again.` (no raw `Unauthorized` propagated to the UI).

## Related docs

- [Environment variables](./environment-variables.md)
- [Audit log and export](./audit-log-and-export.md)
- [Architecture](../architecture.md)
