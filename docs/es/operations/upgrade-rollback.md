# Actualización y reversión

Stack: `ufw-postgres`, `ufw-migrate` (una sola ejecución), `ufw-app`. Las imágenes son universales — configure `APP_URL` en `.env` en tiempo de ejecución.

## Antes de cada actualización

1. [Copia de seguridad](./backup-restore.md) de Postgres y `.env`
2. Anote la etiqueta de imagen actual: `grep IMAGE_TAG .env`
3. Lea las [notas de la versión](https://github.com/finenumbers/ufw/releases)

## Actualización (GHCR + Compose)

1. Actualice `.env`:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Descargue y redespliegue:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Verifique: `docker logs ufw-migrate` (exit 0) y `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

Las migraciones se ejecutan automáticamente mediante `ufw-migrate`.

## Actualización (Portainer)

Actualice `GHCR_*_IMAGE` en el entorno del stack → **Update the stack** (Pull & redeploy).

## Reversión

Las migraciones Prisma son solo hacia adelante. Si una versión nueva aplicó cambios de esquema irreversibles, **restaure Postgres desde la copia de seguridad previa a la actualización** — no revierta solo la etiqueta de imagen.

Reversión segura solo de imagen (sin migración destructiva):

1. Revierta las etiquetas de imagen en `.env` a la versión anterior
2. `docker compose ... pull && docker compose ... up -d`
3. Prueba de humo

## Cambiar APP_URL (cambio de dominio)

1. Actualice NPM Proxy Host
2. Cambie `APP_URL` en `.env`
3. `docker compose ... up -d app`

No hace falta recompilar la imagen. Los usuarios pueden necesitar iniciar sesión de nuevo.

## Documentación relacionada

- [Copia de seguridad y restauración](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
