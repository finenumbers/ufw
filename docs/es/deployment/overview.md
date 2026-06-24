# Resumen de despliegue

Elija cómo ejecutar UFW Remote Manager en producción. Todas las rutas asumen **HTTPS** mediante un proxy inverso existente (se recomienda Nginx Proxy Manager).

![Flujo de despliegue](../../assets/deploy-flow.svg)

## Comparación

| Método | Mejor para | ¿Compilar imágenes? |
|--------|----------|---------------|
| [GHCR + Compose](./ghcr-compose.md) | La mayoría de usuarios autoalojados | No — descargar desde GitHub Packages |
| [Portainer](./portainer.md) | Gestión de stack con interfaz gráfica | No — descargar imágenes GHCR |
| Compose local con compilación | Desarrollo air-gapped o fork | Sí — `docker compose build` |

Nginx Proxy Manager es **siempre externo** — no está incluido en este repositorio.

## Servicios del stack

| Contenedor | Propósito |
|-----------|---------|
| `ufw-postgres` | Base de datos |
| `ufw-migrate` | Ejecuta migraciones de BD una vez por despliegue |
| `ufw-app` | Aplicación web |

## Ruta de producción recomendada

1. Descargue la etiqueta de imagen `v0.1.0` (o la última versión) desde GHCR
2. Genere `.env` en el servidor: `./scripts/generate-production-env.sh .env`
3. Despliegue con Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configure NPM Proxy Host → `ufw-app:3000`
5. Abra `APP_URL/setup`, cree el administrador
6. Ejecute `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Imágenes universales

Configure `APP_URL` en `.env` al desplegar. La misma imagen GHCR sirve para cualquier dominio — sin compilación de imagen por cliente.

## Disciplina con secretos

- Genere secretos solo en el servidor
- Modo de archivo `600` para `.env`
- Nunca almacene secretos en el repositorio git del stack de Portainer ni en tickets públicos

## Documentación relacionada

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variables de entorno](../administration/environment-variables.md)
- [Pruebas de humo](../operations/smoke-tests.md)
