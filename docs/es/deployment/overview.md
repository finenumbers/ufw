# Resumen de despliegue

Elija cómo ejecutar UFW Remote Manager en producción. Todas las rutas usan Docker; PostgreSQL es obligatorio.

## Ruta recomendada

**Imágenes precompiladas GHCR + overlays Compose + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Consulte [GHCR + Compose](./ghcr-compose.md) y [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Métodos de despliegue

| Método | Cuándo usar | ¿Compilar en servidor? |
|--------|-------------|------------------------|
| **GHCR + Compose** | Producción predeterminada | No — `docker compose pull` |
| **Compose build local** | Desarrollo air-gapped o fork | Sí — `docker compose build` |
| **Stack Portainer** | Operaciones con GUI | Opcional — usa GHCR o build |

## Capas de archivos Compose

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Base: postgres, migrate, app |
| `docker-compose.prod.yml` | Producción: sin puertos publicados, red NPM, env prod |
| `docker-compose.ghcr.yml` | Descargar imágenes de GHCR en lugar de build local |

Combine con flags `-f`. Pase siempre `--env-file .env` en producción.

## Contenedor de migración

En cada `up`, **ufw-migrate** ejecuta `prisma migrate deploy` una vez y sale. **No** ejecute `prisma migrate` manualmente dentro de **ufw-app** — use el servicio migrate:

```bash
docker compose run --rm migrate
```

v0.9.2 **no tiene migración nueva** respecto a releases anteriores — la actualización es pull y up.

## Funciones opcionales al desplegar

| Función | Activar |
|---------|---------|
| Escaneo de puertos | `PORT_SCAN_ENABLED=true` — consulte [Escaneo externo de puertos](./port-scan.md) |
| Destinos SSH privados | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

El monitor de contenedores Docker se **eliminó en v0.9.0** — sin flag de entorno.

## Fijación de versión

| Estrategia | Configuración |
|------------|---------------|
| Seguir último release | `GHCR_IMAGE_TAG=latest` (predeterminado) |
| Fijar versión | `GHCR_IMAGE_TAG=v0.9.2` |

## Documentos relacionados

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Variables de entorno](../administration/environment-variables.md)
- [Actualización y reversión](../operations/upgrade-rollback.md)
