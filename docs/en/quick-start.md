# Quick start (local)

Run UFW Remote Manager on your machine with Docker. This path is for **evaluation and development**, not production.

## 1. Clone and configure

```bash
git clone https://github.com/finenumbers/ufw.git
cd ufw
cp .env.example .env
```

The default `.env` uses development-friendly values. Do **not** use these defaults in production.

## 2. Start the stack

```bash
docker compose up -d --build
```

Wait until all containers are healthy:

```bash
docker compose ps
```

You should see `ufw-postgres` (healthy), `ufw-migrate` (exited 0), and `ufw-app` (healthy).

## 3. Open the UI

Open **http://localhost:8088** in your browser.

- **First visit:** `/setup` — create the single administrator account
- **Later visits:** `/login`

## 4. First workflow in the UI

1. **SSH Identities** (`/identities`) — create credentials (password or private key)
2. **Add Server** — choose the identity, enter host/port; SSH is verified automatically on save
3. On the server page — install/enable UFW if needed, then open **Rules**
4. Edit rules, run **Apply preview**, confirm to push changes over SSH

## Useful commands

```bash
docker compose logs -f app          # application logs
docker compose down                 # stop stack
docker compose down -v              # stop and delete database volume
```

## Host development (optional)

Run only Postgres in Docker and the app on the host:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Use port **5434** in `DATABASE_URL` for host access (see `.env.example`).

## Production

For HTTPS deployment behind Nginx Proxy Manager, see [Deployment overview](./deployment/overview.md).
