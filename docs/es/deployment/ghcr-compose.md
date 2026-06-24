# GHCR + Docker Compose

Las imágenes de producción se publican en **GitHub Container Registry (GHCR)**:

| Imagen | Propósito |
|-------|---------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Aplicación Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migraciones Prisma (una sola ejecución) |

Sustituya `finenumbers` por el propietario de su fork si usa un fork.

## Imágenes universales — APP_URL en tiempo de ejecución

Las imágenes son **agnósticas al dominio**. Configure `APP_URL` en `.env` con su URL HTTPS pública. No hace falta compilación por dominio.

## Obtener imágenes

### Opción A — Versión con etiqueta git (recomendado)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions publica las imágenes etiquetadas. Los paquetes deben ser **Public** en el primer uso (GitHub → Packages → settings).

### Opción B — Release (dispatch)

Actions → **Release (dispatch)** → introduzca `image_tag` (p. ej. `v0.1.0-prod`).

## Preparar `.env` en el servidor

```bash
cp .env.production.example .env
# o
./scripts/generate-production-env.sh .env
```

Ejemplo:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=finenumbers
IMAGE_TAG=v0.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
```

Genere secretos:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

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

Validar:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configure NPM — consulte [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Actualizar

Consulte [Actualización y reversión](../operations/upgrade-rollback.md).

## Solución de problemas

| Síntoma | Comprobar |
|---------|-------|
| Bucles de redirección de auth | `APP_URL` coincide exactamente con la URL pública de NPM |
| `pull access denied` | Visibilidad Public del paquete, o `docker login ghcr.io` |
| `APP_URL is required` | `.env` cargado con `--env-file .env` |
| NPM 502 | Aplicación en red `npm_proxy`; nombre de contenedor `ufw-app` |

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [Pruebas de humo](../operations/smoke-tests.md)
