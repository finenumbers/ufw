# Variables de entorno

La configuración en tiempo de ejecución se proporciona mediante `.env` (Compose) o la interfaz de entorno de Portainer. **Nunca suba valores reales a git.**

## Obligatorias (producción)

| Variable | Descripción | Generación |
|----------|-------------|------------|
| `APP_URL` | URL pública de la UI de administración (HTTPS para dominios reales) | Su dominio NPM, p. ej. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Contraseña de la base de datos | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Secreto de firma de sesión (**mín. 32 caracteres** en producción) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Clave AES para credenciales SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nombre de la red Docker compartida con NPM | `docker network ls` |

## Despliegue GHCR (opcional)

Compose y el stack de Portainer usan por defecto `ghcr.io/finenumbers/ufw-remote-manager:latest`. Cada release de GitHub actualiza la etiqueta `latest`.

| Variable | Descripción | Predeterminado |
|----------|-------------|----------------|
| `GHCR_OWNER` | Propietario de GitHub (minúsculas) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Etiqueta de imagen (`latest` o fijar p. ej. `v0.2.1`) | `latest` |

Las variables heredadas `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` ya no son necesarias — las URL de imagen se construyen a partir del propietario + etiqueta en los archivos compose.

## Opcionales

| Variable | Descripción | Predeterminado |
|----------|-------------|----------------|
| `SSH_ALLOWED_CIDRS` | CIDR separados por comas permitidos como destinos SSH | Vacío (IP privadas bloqueadas) |
| `TRUST_PROXY` | Establecer en `1` cuando la aplicación corre detrás de Nginx Proxy Manager para que los límites de tasa de `/setup` usen `X-Forwarded-For` | Sin definir (cabeceras reenviadas ignoradas) |
| `APP_BIND` | Dirección de enlace en compose local | `127.0.0.1` |
| `APP_PORT` | Puerto del host en compose local | `8088` |
| `POSTGRES_PORT` | Puerto del host para Postgres en dev | `5434` |
| `LOG_LEVEL` | Nivel de registro Pino | `info` |

## Límites de tasa (fijos)

Las acciones repetidas de servidor usan un periodo de espera de **30 segundos** por servidor (no configurable mediante variables de entorno):

- Actualización de estado UFW y sincronización de reglas
- Inicio de escaneo de puertos

Desde **v0.5.1**, variables heredadas como `PORT_SCAN_RATE_LIMIT_WINDOW_MS` se **ignoran** si siguen presentes en `.env`.

Los buckets de límite de tasa en memoria se eliminan cuando están vacíos (solo despliegue de réplica única — consulte [Arquitectura](../architecture.md)).

## APP_URL vs HTTP interno

Dos URL distintas cumplen roles diferentes:

| Ajuste | Ejemplo | Propósito |
|--------|---------|-----------|
| **`APP_URL`** | `https://ufw.example.com` | URL pública para Better Auth, cookies y redirecciones del navegador |
| **Esquema Proxy Host NPM** | `http` → `ufw-app:8088` | Tráfico Docker interno; NPM termina TLS |

**No** establezca `APP_URL` en la URL interna del contenedor. Better Auth requiere el dominio HTTPS público que los usuarios escriben en el navegador.

En producción, `APP_URL` debe usar **HTTPS** para nombres de host reales. Las únicas excepciones son `http://localhost` y `http://127.0.0.1` (pruebas de humo locales y CI).

## Producción detrás de NPM

Cuando `ufw-app` está detrás de Nginx Proxy Manager en una red Docker compartida:

1. Establezca `TRUST_PROXY=1` en el entorno de la aplicación para que los límites de tasa de `/setup` usen la IP del cliente de `X-Forwarded-For` (NPM establece esta cabecera).
2. Sin `TRUST_PROXY`, los límites de setup usan un bucket compartido único (`direct`) — aceptable en dev local, no ideal en producción.

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
