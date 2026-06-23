# UFW Remote Manager

Self-hosted web service for remote UFW management on Linux servers over SSH.

## Stack

- Next.js (App Router), TypeScript, PostgreSQL, Prisma, Better Auth
- Tailwind CSS, shadcn/ui, TanStack Table, React Hook Form, Zod
- ssh2, p-queue, pino, papaparse, xlsx

## Production (Docker Compose — recommended)

Two containers: **app** (Next.js) + **postgres**.

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:3000` and complete first-run setup.

Useful commands:

```bash
docker compose logs -f app      # app logs
docker compose ps               # status
docker compose down             # stop
docker compose down -v          # stop + remove DB volume
```

Environment (optional, in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:3000` | Public URL for auth callbacks |
| `APP_PORT` | `3000` | Host port mapped to the app |

Auth and SSH credential encryption keys are derived automatically from `DATABASE_URL`. Optional overrides: `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

On stack start the `migrate` service applies Prisma migrations, then the `app` container starts.

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

## Security Notes

- SSH credentials are encrypted at rest (AES-256-GCM).
- All SSH/UFW mutations require explicit confirmation in the UI.
- Per-server SSH operations are serialized via `p-queue` (`concurrency: 1`).
- Run behind HTTPS reverse proxy in production.
- Restrict network access to the admin UI.
- Back up the `ufw_postgres_data` volume regularly.

## Project Structure

- `src/lib/ssh` — SSH client and verification
- `src/lib/ufw` — UFW parsing, diff, plan, apply
- `src/server/services` — orchestration layer
- `src/server/actions` — typed server actions
- `src/components` — UI (sidebar, rules table, dialogs)
- `Dockerfile` — production app image
- `docker-compose.yml` — app + postgres stack
