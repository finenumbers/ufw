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

- Host validation blocks SSRF to private/metadata addresses
- Optional `SSH_ALLOWED_CIDRS` for internal networks
- Host key pinning on first successful connection
- Imported keys marked unverified until SSH test succeeds
- Command injection prevented via allowlisted enums and sanitized UFW command building

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

## Network exposure checklist

- [ ] Admin UI only via HTTPS reverse proxy
- [ ] Postgres not exposed to host/internet in production
- [ ] Restrict admin URL (VPN, IP allowlist in NPM)
- [ ] Strong unique `.env` secrets
- [ ] Regular Postgres + `.env` backups off-host
- [ ] Rotate secrets if export or `.env` may have leaked

## Error sanitization

Client-facing errors from SSH/apply paths are sanitized to avoid leaking stack traces or internal paths.

## Related docs

- [Environment variables](./environment-variables.md)
- [Audit log and export](./audit-log-and-export.md)
- [Architecture](../architecture.md)
