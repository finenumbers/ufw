# GHCR + Docker Compose

Las imágenes de producción se publican en **GitHub Container Registry (GHCR)**:

| Imagen | Propósito |
|--------|-----------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | App Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migraciones Prisma (ejecución única) |

Cada release publica **`latest`** más tags de versión (p. ej. `v0.8.0`, `0.6.1`). Los despliegues de producción usan **`latest`** por defecto — no se requiere versión en `.env`.

Reemplace `finenumbers` por el propietario de su fork si usa un fork (`GHCR_OWNER` en `.env`).

## Imágenes universales — APP_URL en tiempo de ejecución

Las imágenes son **agnósticas al dominio**. Defina `APP_URL` en `.env` a su URL HTTPS pública. No se requiere build por dominio.

## Obtener imágenes

### Opción A — Release por tag Git (recomendado)

```bash
git tag v0.8.0
git push origin v0.8.0
```

GitHub Actions publica imágenes etiquetadas y actualiza `latest`. Los paquetes deben ser **Public** en el primer uso (GitHub → Packages → ajustes).

### Opción B — Release (dispatch)

Actions → **Release (dispatch)** → introducir `image_tag` (tag personalizado; no actualiza `latest` salvo que etiquete `latest` manualmente).

## Preparar `.env` en el servidor

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Ejemplo (secretos requeridos; vars de imagen opcionales):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
```

Generar secretos:

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

Configurar NPM — véase [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Actualización

Redesplegar con `docker compose ... pull && up -d` — sin cambios en `.env` al usar `latest`.

Véase [Actualización y rollback](../operations/upgrade-rollback.md) para fijar una versión.

## Solución de problemas

| Síntoma | Comprobar |
|---------|-----------|
| Bucles de redirección auth | `APP_URL` coincide exactamente con la URL pública NPM |
| `pull access denied` | Visibilidad del paquete Public, o `docker login ghcr.io` |
| `APP_URL is required` | `.env` cargado con `--env-file .env` |
| NPM 502 | App en red `npm_proxy`; nombre del contenedor `ufw-app` |

## Documentación relacionada

- [Resumen de despliegue](./overview.md)
- [Pruebas smoke](../operations/smoke-tests.md)
