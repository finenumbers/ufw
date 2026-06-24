# Architecture

This page describes how UFW Remote Manager is built, how data flows, and where secrets live.

![Deployment topology](../assets/architecture-topology.svg)

*Diagram: Browser → reverse proxy → app → Postgres; app → target servers over SSH.*

## Components

| Component | Role |
|-----------|------|
| **ufw-app** | Next.js application (UI + API + server actions) |
| **ufw-postgres** | PostgreSQL — users, encrypted credentials, rules, snapshots, audit |
| **ufw-migrate** | One-shot container — runs `prisma migrate deploy` on each deploy |
| **Nginx Proxy Manager** | External HTTPS termination (not part of this stack) |
| **Target Linux servers** | UFW-managed hosts reached over SSH |

## Request flow (production)

```mermaid
flowchart LR
  Browser -->|HTTPS| NPM[Nginx_Proxy_Manager]
  NPM -->|HTTP| App[ufw_app:3000]
  App --> DB[(PostgreSQL)]
  App -->|SSH| Server1[Linux_UFW]
  App -->|SSH| Server2[Linux_UFW]
```

1. The administrator opens `APP_URL` in a browser (HTTPS via NPM).
2. Better Auth validates the session cookie.
3. Server actions and API routes orchestrate SSH and database work.
4. UFW commands run on remote hosts only after explicit apply confirmation.

## Runtime configuration

Public URL is set at **runtime**, not baked into the Docker image:

- `APP_URL` in `.env` → `BETTER_AUTH_URL` in the container
- One GHCR image works for any domain — see [GHCR + Compose](./deployment/ghcr-compose.md)

Implementation: `getPublicAppUrl()` in `src/lib/app-url.ts`.

## Concurrency model

- **Per-server SSH queue** (`p-queue`, concurrency 1) — operations on the same host are serialized
- **Single app replica** in production — rate limits are in-memory
- Do not scale to multiple app replicas without adding shared rate-limit storage (e.g. Redis)

## Data storage

| Data | Location | Encrypted? |
|------|----------|------------|
| SSH passwords / private keys | Postgres (`identity` table) | Yes — AES-256-GCM with `APP_ENCRYPTION_KEY` |
| UFW rules, drafts, snapshots | Postgres | Metadata only; rule content is not secret |
| Sessions | Postgres (Better Auth) | Session tokens; protected by `BETTER_AUTH_SECRET` |
| Audit events | Postgres | Who did what and when |
| `.env` secrets | Host filesystem only | Must never be in git |

## Security boundaries

- Postgres is **not** published to the host in production (`docker-compose.prod.yml`)
- App port is reachable on the Docker network (NPM + internal), not on `0.0.0.0` in prod
- SSH target validation blocks private/metadata IPs by default; optional `SSH_ALLOWED_CIDRS`
- Production responses include CSP, HSTS, and security headers (`next.config.ts`)

## Related docs

- [Security model](./administration/security-model.md)
- [Draft and apply workflow](./concepts/draft-apply-workflow.md)
- [Environment variables](./administration/environment-variables.md)
