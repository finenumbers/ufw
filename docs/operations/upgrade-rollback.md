# Upgrade and rollback

Production stack: `ufw-postgres`, `ufw-migrate` (one-shot), `ufw-app`.

Images are **universal** — `APP_URL` is set in `.env` at runtime, not baked into the image.

## Before every upgrade

1. **Backup** — see [backup-restore.md](./backup-restore.md)
2. **Record current version** in `.env`:

   ```bash
   grep -E '^(IMAGE_TAG|GHCR_APP_IMAGE)=' .env
   ```

3. **Read release notes** for breaking changes or manual steps (migrations are automatic, but some releases may need UI actions).

---

## Upgrade (GHCR + Compose)

### 1. Update image tag in `.env`

```bash
IMAGE_TAG=v1.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v1.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v1.1.0
```

Replace `finenumbers` with your GitHub owner if you forked.

### 2. Pull and redeploy

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

What happens:

1. `ufw-postgres` stays running (data preserved).
2. `ufw-migrate` runs **once** with the new migrate image → `prisma migrate deploy`.
3. `ufw-app` starts after migrate succeeds.

### 3. Verify

```bash
./scripts/smoke-production.sh --env-file .env --ghcr
```

Check migrate logs:

```bash
docker logs ufw-migrate
```

Expected: migration applied or "No pending migrations".

### 4. Smoke in browser

1. `APP_URL/login` — session still valid or re-login works
2. Open a server → SSH test
3. Rules page → apply preview (no apply required)

---

## Upgrade (Portainer)

1. Pull new images (GitHub [Release](../../.github/workflows/release.yml) or [dispatch](../../.github/workflows/release-dispatch.yml))
2. Portainer → stack → **Editor** → update `IMAGE_TAG`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`
3. **Update the stack** (Pull & redeploy)
4. Confirm `ufw-migrate` exited 0 in container logs
5. Run `./scripts/smoke-production.sh` on the host (SSH to server) or manual health check

---

## Upgrade (local build from source)

```bash
git fetch origin
git checkout v1.1.0   # or main

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --env-file .env \
  up -d --build
```

---

## Rollback

Rollback is safe **only if the new release did not run irreversible database migrations**.

Prisma migrations are forward-only. If a new version applied a migration that changed schema, rolling back the **app image alone** may break the app. In that case: **restore Postgres from backup** taken before upgrade.

### Rollback app image (same DB schema)

1. Revert `.env` to previous tags:

   ```bash
   IMAGE_TAG=v1.0.0
   GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v1.0.0
   GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v1.0.0
   ```

2. Redeploy:

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

3. `ufw-migrate` on older image will typically report no pending migrations (schema already at newer revision — **this is OK** if the older app is still compatible with current schema).

4. If the app fails after rollback → restore DB from pre-upgrade backup.

### Rollback with database restore

Use when upgrade broke data or schema mismatch:

1. Stop app: `docker compose ... stop app`
2. Restore dump — [backup-restore.md](./backup-restore.md)
3. Deploy **previous** image tags
4. Smoke test

---

## Changing `APP_URL` (domain move)

No image rebuild required.

1. Update NPM Proxy Host to the new domain
2. Change `APP_URL` in `.env` (and Portainer env if used)
3. Restart app:

   ```bash
   docker compose ... up -d app
   ```

4. Users may need to log in again (cookie domain changed)

---

## Troubleshooting upgrades

| Symptom | Action |
|---------|--------|
| `ufw-migrate` exits non-zero | `docker logs ufw-migrate` — fix DB or restore backup; do not restart app until migrate succeeds |
| App unhealthy after upgrade | `docker logs ufw-app` — check `APP_URL`, secrets, DB connection |
| Login loops after upgrade | `APP_URL` must match NPM public URL exactly |
| SSH credentials invalid | Wrong `APP_ENCRYPTION_KEY` in `.env` — restore correct `.env` from backup |
| Rollback app but errors persist | DB schema ahead of app — restore pre-upgrade Postgres dump |

---

## Related docs

- [Backup and restore](./backup-restore.md)
- [GHCR deploy](../deploy/ghcr.md)
- [Portainer deploy](../deploy/portainer.md)
