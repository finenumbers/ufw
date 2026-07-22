# Модель безопасности

UFW Remote Manager — **privileged admin tool**: хранит SSH secrets, выполняет remote firewall commands и exposes web UI. Design assumptions и controls documented here.

## Threat model (summary)

| Asset | Risk | Mitigation |
|-------|------|------------|
| SSH credentials | Disclosure | AES-256-GCM at rest; decrypted only for connections |
| Session cookie | Hijack | HTTPS, HTTP-only cookies, `BETTER_AUTH_SECRET` |
| Host impersonation | MITM on SSH | Host key fingerprint on first connect; unverified blocks apply |
| Unauthorized admin | Brute force | Single user; setup rate limit; strong passwords |
| CSRF / XSS | Account abuse | Framework defaults, CSP in production |
| Config export file | Secret leak | Password step-up; operator responsibility |

App **does not** implement per-server ACLs — any logged-in admin can manage all servers.

## Authentication

- Better Auth email/password sessions
- Registration disabled after first user (`/setup` once)
- Logout clears session; login/logout audited

Run only over **HTTPS** in production (`APP_URL` must use https except localhost).

## Encryption at rest

| Secret | Key |
|--------|-----|
| Identity passwords and keys | `APP_ENCRYPTION_KEY` (32 bytes) |
| Session signing | `BETTER_AUTH_SECRET` (min 32 chars in prod) |

Rotating `APP_ENCRYPTION_KEY` without re-importing identities renders stored ciphertext unusable.

## Network exposure

Production compose (`docker-compose.prod.yml`):

- Postgres **not** published to host
- App listens inside Docker network for NPM
- Target SSH from app container to managed servers

TLS terminates at **Nginx Proxy Manager**. Internal HTTP between NPM and `ufw-app` is by design — see [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## SSH security

- Default block on private/metadata target IPs
- Optional `SSH_ALLOWED_CIDRS` for lab/VPN
- Host key TOFU — see [Серверы и SSH](../concepts/servers-and-ssh.md)
- Apply blocked until host key verified

## Application hardening

Production HTTP headers (CSP, HSTS, etc.) via `next.config.ts`.

Health endpoint `/api/health` exposes version — no secrets.

## Audit

Sensitive actions write `auditEvent` rows: login, logout, apply, snapshot, port scan, config export, server changes. See [Журнал аудита и экспорт](./audit-log-and-export.md).

## Single replica

Rate limits and queues are **in-memory**. Multiple app replicas without shared state weaken rate limiting and queue guarantees.

## Reporting vulnerabilities

See [SECURITY.md](../../../SECURITY.md) in repository root (English).

## Связанные документы

- [Переменные окружения](./environment-variables.md)
- [Архитектура](../architecture.md)
