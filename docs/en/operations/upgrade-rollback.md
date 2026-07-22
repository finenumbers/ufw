# Upgrade and rollback

## Upgrade (recommended)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

The **migrate** service runs `prisma migrate deploy` automatically.

Verify:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Version notes

| Version | Migration | Notable changes |
|---------|-----------|-----------------|
| **v0.9.0** | Yes — removes legacy inventory tables | Legacy inventory UI removed |
| **v0.9.1** | No | Legacy cleanup, doc guardrails |
| **v0.9.2** | No | Apply sync fix, operation banner lifecycle, port scan off SSH queue, overlap guard |
| **v0.9.3** | No | Flexible rules Name column width |
| **v0.9.4** | No | Address overlap violet highlight, import overlap notice |
| **v0.9.5** | No | Enable UFW action, rules table i18n, host key apply guard, release CI gate |

When upgrading from pre-v0.9.0, ensure migrate completes — legacy inventory data purged.

Pin image: `GHCR_IMAGE_TAG=v0.9.5` in `.env`.

## Rollback

1. Set `GHCR_IMAGE_TAG` to previous known-good tag
2. `docker compose ... pull && up -d`
3. If migration already applied forward-only, restoring older DB backup may be required — test rollback in staging

Database migrations are generally **not** reversed automatically.

## Zero-downtime

Single-container app — expect brief restart during `up -d`. Schedule maintenance window for production.

## Related docs

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Backup and restore](./backup-restore.md)
