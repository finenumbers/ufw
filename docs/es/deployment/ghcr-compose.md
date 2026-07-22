# GHCR + Docker Compose

Descargue imágenes precompiladas de GitHub Container Registry — recomendado para producción.

## Requisitos previos

- Docker Compose v2
- `.env` desde [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager en red Docker compartida (`NPM_NETWORK`)

## Nombres de imagen

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Cada release de GitHub actualiza la etiqueta `latest`. Fije `GHCR_IMAGE_TAG=v0.9.2` para versiones fijas.

## Desplegar

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

Validar configuración renderizada:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Actualizar

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate se ejecuta automáticamente. v0.9.0+ eliminó tablas de inventario legacy — asegure que migrate complete una vez al actualizar desde versiones antiguas.

No se requieren cambios en `.env` al mantenerse en `latest`.

## Prueba de humo

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Solución de problemas

| Error | Solución |
|-------|----------|
| `pull access denied` | Visibilidad del paquete Pública, o `docker login ghcr.io` |
| Migrate falla | Consulte logs: `docker compose logs migrate` |
| Health check falla | `docker compose logs app`; verifique secretos y `APP_URL` |

## Documentos relacionados

- [Resumen de despliegue](./overview.md)
- [Actualización y reversión](../operations/upgrade-rollback.md)
