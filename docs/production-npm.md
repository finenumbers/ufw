# Production deployment behind existing NPM

Nginx Proxy Manager (NPM) must **already be installed and running** on the host. This project does not deploy NPM.

## Stack

This compose stack runs only:

- `ufw-postgres` — PostgreSQL
- `ufw-migrate` — one-shot Prisma migrations
- `ufw-app` — Next.js application

## 1. Prepare `.env`

```bash
APP_URL=https://ufw.example.com
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
APP_ENCRYPTION_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=<strong-password>
NPM_NETWORK=<existing_npm_docker_network>
```

Find `NPM_NETWORK`:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container_name> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## 2. Build and start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Validate compose config:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
```

## 3. Configure Proxy Host in NPM (manual)

In the **existing** NPM UI, create or update a Proxy Host:

| Field | Value |
|-------|-------|
| Domain Names | domain from `APP_URL` |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
| Websockets Support | enabled |
| Block Common Exploits | recommended |
| SSL | Let's Encrypt or existing certificate |
| Force SSL | recommended |

NPM terminates TLS; the app receives HTTP on the shared Docker network.

## 4. Smoke test

Open `APP_URL` in a browser:

1. Complete `/setup` (single admin)
2. Log in
3. Add a server and test SSH
4. Open rules and run apply preview

Health check (from a host on the Docker network):

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(console.log)"
```

## Notes

- Changing `APP_URL` requires `docker compose ... up -d --build` (NEXT_PUBLIC_APP_URL is baked at build time).
- Postgres is not published to the host in production (`docker-compose.prod.yml` resets ports).
- Rate limiting is in-memory; run a single app replica unless you add Redis later.
