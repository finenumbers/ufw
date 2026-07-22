# Quick start

Run UFW Remote Manager locally with Docker. This path is for **evaluation and development**, not production.

## Prerequisites

- Docker and Docker Compose
- Git
- Port **8088** free on localhost (configurable via `APP_PORT`)

## 1. Clone and configure

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

Default `.env` values work for local use. Secrets are pre-filled for development only — generate new ones for any shared or production deployment.

## 2. Start the stack

```bash
docker compose up -d --build
```

This starts:

| Service | Role |
|---------|------|
| **postgres** | PostgreSQL database |
| **migrate** | Runs `prisma migrate deploy` once, then exits |
| **app** | Next.js UI on port 8088 |

Check status:

```bash
docker compose ps
docker compose logs -f app
```

## 3. Create the admin account

Open **http://localhost:8088/setup**

- Registration is available **only once** — while no user exists
- After setup, `/setup` redirects to login
- Use a strong password; this is the only admin account

## 4. Create an SSH identity

1. Sidebar → **SSH Identities** → **Add Identity**
2. Choose authentication: password, private key, or key with passphrase
3. Save — credentials are encrypted with `APP_ENCRYPTION_KEY`

See [SSH identities](./concepts/ssh-identities.md).

## 5. Add a server

1. Sidebar → **Servers** → **Add Server**
2. Enter name, host, port, select identity
3. **Create Server** verifies SSH automatically

On success you land on the server dashboard. The UFW badge shows cached state (empty until first refresh).

## 6. Refresh and work with rules

1. Click **Refresh Status** — live SSH read; creates first UFW snapshot
2. If UFW is missing, use **Install UFW** (after refresh confirms it is not installed)
3. When UFW is active, edit rules in the table
4. **Apply preview** → review → **Confirm** to push changes

If no snapshot exists yet, an automatic background **initial sync** may run once — see [Manage servers](./user-guide/manage-servers.md).

## Optional: enable port scan locally

Add to `.env`:

```env
PORT_SCAN_ENABLED=true
```

Rebuild/restart the app container. Port scan requires Naabu and Nmap in the image (included in the official Dockerfile).

## Development without full Docker app

Run only Postgres in Docker, app on host:

```bash
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

App listens on **http://localhost:8088** (see `package.json`).

## Stop and reset

```bash
docker compose down          # stop containers
docker compose down -v       # stop and delete database volume
```

## Next steps

- [Architecture](./architecture.md)
- [Production deployment](./deployment/overview.md)
- [Security model](./administration/security-model.md)
