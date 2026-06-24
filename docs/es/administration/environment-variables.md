# Variables de entorno

La configuración en tiempo de ejecución se suministra mediante `.env` (Compose) o la interfaz de entorno de Portainer. **Nunca suba valores reales a git.**

## Obligatorias (producción)

| Variable | Descripción | Generar |
|----------|-------------|----------|
| `APP_URL` | URL HTTPS pública de la interfaz de administración | Su dominio NPM, p. ej. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Secreto de firma de sesión | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clave AES para credenciales SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nombre de red Docker compartida con NPM | `docker network ls` |

## Despliegue GHCR

| Variable | Descripción |
|----------|-------------|
| `GHCR_APP_IMAGE` | p. ej. `ghcr.io/finenumbers/ufw-remote-manager:v0.1.0` |
| `GHCR_MIGRATE_IMAGE` | p. ej. `ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0` |
| `IMAGE_TAG` | Etiqueta de referencia en documentación/scripts |
| `GHCR_OWNER` | Propietario GitHub (minúsculas), p. ej. `finenumbers` |

## Opcionales

| Variable | Descripción | Predeterminado |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDRs separados por comas permitidos como destinos SSH | Vacío (IPs privadas bloqueadas) |
| `APP_BIND` | Dirección de enlace en compose local | `127.0.0.1` |
| `APP_PORT` | Puerto del host en compose local | `8088` |
| `POSTGRES_PORT` | Puerto del host para Postgres en dev | `5434` |
| `LOG_LEVEL` | Nivel de registro Pino | `info` |

## Cómo llegan las variables a los contenedores

En `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

La aplicación lee `APP_URL` o `BETTER_AUTH_URL` en tiempo de ejecución (`getPublicAppUrl()`).

## Plantillas y generadores

- [`.env.example`](../../../.env.example) — desarrollo local
- [`.env.production.example`](../../../.env.production.example) — plantilla de producción
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — generador interactivo

## Documentación relacionada

- [Modelo de seguridad](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
