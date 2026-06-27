# Resumen de despliegue

Elija cómo ejecutar UFW Remote Manager en producción. Todas las rutas asumen **HTTPS** mediante un proxy inverso existente (se recomienda Nginx Proxy Manager).

![Flujo de despliegue](../../assets/deploy-flow.svg)

## Comparación

| Método | Ideal para | ¿Construir imágenes? |
|--------|------------|------------------------|
| [GHCR + Compose](./ghcr-compose.md) | La mayoría de self-hosters | No — pull desde GitHub Packages |
| [Portainer](./portainer.md) | Gestión de stack con GUI | No — pull de imágenes GHCR |
| Build local Compose | Desarrollo air-gapped o fork | Sí — `docker compose build` |

Nginx Proxy Manager es **siempre externo** — no incluido en este repositorio.

## Servicios del stack

| Contenedor | Propósito |
|------------|-----------|
| `ufw-postgres` | Base de datos |
| `ufw-migrate` | Ejecuta migraciones BD una vez por despliegue |
| `ufw-app` | Aplicación web (incluye Naabu/Nmap cuando el escaneo de puertos está activado) |

## Ruta de producción recomendada

1. Pull del tag de imagen **`latest`** (o fijar p. ej. `v0.6.1`) desde GHCR
2. Generar `.env` en el servidor: `./scripts/generate-production-env.sh .env`
3. Desplegar con Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configurar NPM Proxy Host → `ufw-app:8088`
5. Abrir `APP_URL/setup`, crear admin
6. Ejecutar `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Opcional: activar [escaneo de puertos externo](./port-scan.md) con `PORT_SCAN_ENABLED=true`
8. Opcional: activar [monitorización de contenedores Docker](./docker-monitor.md) con `DOCKER_MONITOR_ENABLED=true`

## Imágenes universales

Defina `APP_URL` en `.env` al desplegar. La misma imagen GHCR funciona para cualquier dominio — sin build de imagen por cliente.

## Disciplina de secretos

- Generar secretos solo en el servidor
- Modo de archivo `600` para `.env`
- Nunca almacenar secretos en el repo git del stack Portainer o tickets públicos

## Documentación relacionada

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variables de entorno](../administration/environment-variables.md)
- [Pruebas smoke](../operations/smoke-tests.md)
