# GHCR deployment

Production images are published to **GitHub Container Registry (GHCR)**:

| Image | Purpose |
|-------|---------|
| `ghcr.io/OWNER/ufw-remote-manager:TAG` | Next.js app |
| `ghcr.io/OWNER/ufw-remote-manager-migrate:TAG` | One-shot Prisma migrations |

Replace `OWNER` with your GitHub username or organization (lowercase).

## Universal images — APP_URL at runtime

GHCR images are **domain-agnostic**. Set `APP_URL` in your server `.env` to the public HTTPS URL that Nginx Proxy Manager exposes. No per-domain image build is required.

## 1. Get images

### Option A — Git tag release (recommended)

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions publishes `ghcr.io/OWNER/ufw-remote-manager:v1.0.0` (and `latest`).

Make packages public (first publish):

1. GitHub → Packages → `ufw-remote-manager` → Package settings → Change visibility → Public.

### Option B — Custom tag (dispatch)

Actions → **Release (dispatch)** → Run workflow with an `image_tag` (e.g. `v1.0.0-prod` or `sha-abc1234`).

Use this when you need a tag without creating a git release.

## 2. Prepare secrets on the server

Never commit secrets to git.

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Edit `.env`:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=your-github-owner
IMAGE_TAG=v1.0.0
GHCR_APP_IMAGE=ghcr.io/your-github-owner/ufw-remote-manager:v1.0.0
GHCR_MIGRATE_IMAGE=ghcr.io/your-github-owner/ufw-remote-manager-migrate:v1.0.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
```

Generate secrets:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## 3. Deploy with Compose (NPM)

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  pull

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

Validate config:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  config
```

Configure NPM Proxy Host → `ufw-app:3000` (see [production-npm.md](../production-npm.md)).

## 4. Upgrade

See [operations/upgrade-rollback.md](../operations/upgrade-rollback.md) for the full runbook.

1. Pull or build new GHCR images for the desired tag.
2. Update `IMAGE_TAG` / `GHCR_*_IMAGE` in `.env`.
3. Redeploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

4. Verify: `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Migrations run automatically via the `migrate` service on each deploy.

## 5. Smoke test

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Backup before upgrades: [operations/backup-restore.md](../operations/backup-restore.md)

Open `APP_URL/setup` (first run) or `/login`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Auth redirect loops | `APP_URL` in `.env` exactly matches the NPM public URL (scheme + host) |
| `pull access denied` | GHCR package visibility → Public, or `docker login ghcr.io` |
| `BETTER_AUTH_SECRET is required` | `.env` loaded (`--env-file .env`) |
| `APP_URL is required` | `APP_URL` set in `.env` and passed to the app container |
| NPM 502 | App on `npm_proxy` network; container name `ufw-app` |
