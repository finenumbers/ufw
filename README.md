# UFW Remote Manager

Self-hosted web service for remote UFW management on Linux servers over SSH.

## Stack

- Next.js (App Router), TypeScript, PostgreSQL, Prisma, Better Auth
- Tailwind CSS, shadcn/ui, TanStack Table, React Hook Form, Zod
- ssh2, p-queue, pino, papaparse, xlsx

## Quick start (local)

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:3000` and complete first-run setup.

**First steps in the UI:** create an **SSH Identity** (`/identities`), then **Add Server** and choose that identity.

## Production deployment

Production runs behind **HTTPS** (Nginx Proxy Manager recommended). Secrets stay **on the server only** — never commit `.env` to git.

| Method | Docs |
|--------|------|
| GHCR images + Compose | [docs/deploy/ghcr.md](docs/deploy/ghcr.md) |
| Portainer stack | [docs/deploy/portainer.md](docs/deploy/portainer.md) |
| NPM + local build | [docs/production-npm.md](docs/production-npm.md) |
| Backup / upgrade / smoke | [docs/operations/](docs/operations/) |

**Recommended path:**

1. Pull GHCR images from a release tag (e.g. `v1.0.0`) or build via GitHub Actions
2. Generate `.env` on the server: `./scripts/generate-production-env.sh .env`
3. Deploy via Portainer or `docker compose ... -f docker-compose.ghcr.yml`
4. Configure NPM Proxy Host → `ufw-app:3000`
5. Smoke test: `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Templates: [`.env.production.example`](.env.production.example)

### Production secrets (required)

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Strong unique DB password |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | `openssl rand -base64 32` (32 decoded bytes) |
| `APP_URL` | Public HTTPS URL (set in `.env` at deploy time) |
| `NPM_NETWORK` | Docker network shared with NPM |

Development-only defaults in `.env.example` are **not** safe for production.

## Local development (optional)

Run only Postgres in Docker, app on the host:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

For host access to Postgres use port **5434** in `DATABASE_URL` (see `.env.example`).

## Useful commands

```bash
docker compose logs -f app
docker compose ps
docker compose down
docker compose down -v    # removes DB volume
```

## Security Notes

- SSH credentials are encrypted at rest (AES-256-GCM).
- All SSH/UFW mutations require explicit confirmation in the UI.
- Per-server SSH operations are serialized via `p-queue` (`concurrency: 1`).
- Exporting server configuration requires password re-entry and writes a `CONFIG_EXPORT` audit event. The downloaded JSON still contains plaintext SSH secrets — store it securely.
- SSH host keys are pinned on first successful connection. Keys imported from configuration files are marked unverified until an SSH test succeeds.
- Use `SSH_ALLOWED_CIDRS` to permit private IPv4 ranges when needed (e.g. `10.0.0.0/8`).
- Partial UFW apply may leave remote rules out of sync — use **Force resync from server** when prompted.
- Run behind HTTPS reverse proxy in production (HSTS when `NODE_ENV=production`).
- Restrict network access to the admin UI.
- Back up the `ufw_postgres_data` volume regularly — see [docs/operations/backup-restore.md](docs/operations/backup-restore.md)

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

## Project Structure

- `src/lib/ssh` — SSH client and verification
- `src/lib/ufw` — UFW parsing, diff, plan, apply
- `src/server/services` — orchestration layer
- `deploy/portainer.stack.yml` — Portainer production stack
- `docker-compose.ghcr.yml` — pull from GHCR instead of local build
