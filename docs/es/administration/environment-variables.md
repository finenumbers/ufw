# Variables de entorno

Configuración en tiempo de ejecución vía `.env` (Compose) o interfaz de entorno de Portainer. **Nunca suba valores reales a git.**

## Obligatorias (producción)

| Variable | Descripción | Generar |
|----------|-------------|---------|
| `APP_URL` | URL HTTPS pública de la interfaz admin | Su dominio NPM, p. ej. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Contraseña de base de datos | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Firma de sesión (**mín. 32 caracteres** en producción) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clave AES para credenciales SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Red Docker compartida con NPM | `docker network ls` |
| `TRUST_PROXY` | Configure `1` detrás de NPM para límites de setup precisos | `1` |

## Despliegue GHCR

Imagen predeterminada: `ghcr.io/finenumbers/ufw-remote-manager:latest` (actualizada en cada release).

| Variable | Descripción | Predeterminado |
|----------|-------------|----------------|
| `GHCR_OWNER` | Propietario GitHub (minúsculas) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Etiqueta (`latest` o fijar p. ej. `v0.9.2`) | `latest` |

Fije `GHCR_IMAGE_TAG=v0.9.2` para despliegues reproducibles; use `latest` para actualizaciones automáticas en `pull`.

`GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` legacy ya no se usan.

## Escaneo de puertos (opcional)

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `PORT_SCAN_ENABLED` | sin definir (desactivado) | Configure `true` para activar interfaz y pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Máx. puertos enviados a enriquecimiento Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Tiempo de espera descubrimiento completo (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Tiempo de espera enriquecimiento (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Ejecuciones de escaneo almacenadas por servidor |

`PORT_SCAN_RATE_LIMIT_WINDOW_MS` legacy se **ignora**. Los escaneos repetidos usan enfriamiento fijo de **30 segundos** en código de app.

## SSH y proxy

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `SSH_ALLOWED_CIDRS` | vacío | CIDR separados por comas permitidos como destinos SSH |
| `TRUST_PROXY` | sin definir | `1` = confiar en `X-Forwarded-For` para límite de setup |

## Desarrollo local

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `APP_BIND` | `127.0.0.1` | Dirección bind de Compose |
| `APP_PORT` | `8088` | Puerto del host |
| `POSTGRES_PORT` | `5434` | Puerto Postgres del host |
| `LOG_LEVEL` | `info` | Nivel de log Pino |

## Eliminadas / ignoradas (histórico)

| Variable | Estado |
|----------|--------|
| Variables legacy de inventario de contenedores (pre-v0.9.0) | Ignoradas — función eliminada en v0.9.0 |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Ignorada desde v0.5.1 |

## Límites de tasa (fijos en código)

Enfriamiento de 30 segundos por servidor: actualización/sync UFW, inicio escaneo de puertos. No configurable por entorno.

Buckets en memoria — solo réplica única. Consulte [Arquitectura](../architecture.md).

## APP_URL vs HTTP interno

| Configuración | Ejemplo | Propósito |
|---------------|---------|-----------|
| **`APP_URL`** | `https://ufw.example.com` | URL del navegador, cookies Better Auth |
| **NPM → app** | `http://ufw-app:8088` | Tráfico Docker interno |

**No** configure `APP_URL` a la URL interna del contenedor.

Producción requiere **HTTPS** en `APP_URL` salvo `localhost` / `127.0.0.1`.

## Cómo llegan las variables a los contenedores

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

La app lee `APP_URL` o `BETTER_AUTH_URL` vía `getPublicAppUrl()`.

## Plantillas

- [`.env.example`](../../../.env.example) — desarrollo local
- [`.env.production.example`](../../../.env.production.example) — plantilla de producción
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — generador interactivo

## Documentos relacionados

- [Modelo de seguridad](./security-model.md)
- [Escaneo externo de puertos](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
