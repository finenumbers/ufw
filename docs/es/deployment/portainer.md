# Despliegue con Portainer

Despliegue con **Portainer** usando imágenes precompiladas de **GHCR** detrás de **Nginx Proxy Manager** existente.

NPM no está incluido en este stack.

## Requisitos previos

- Host Docker con Portainer y NPM en ejecución
- Imágenes GHCR desde [releases](https://github.com/finenumbers/ufw/releases) — etiqueta `latest` actualizada en cada release; fije `GHCR_IMAGE_TAG=v0.9.2` si hace falta
- Nombre de red Docker NPM (p. ej. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Variables de entorno

```bash
./scripts/generate-production-env.sh .env
```

**Obligatorias:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Opcionales:** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Crear stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nombre: `ufw-remote-manager`
3. Pegue [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment → **Advanced mode** → pegue secretos de `.env`
5. **Deploy the stack**

### Repositorio Git

1. Repositorio: `https://github.com/finenumbers/ufw`
2. Ruta Compose: `deploy/portainer.stack.yml`
3. Configure entorno en interfaz Portainer — nunca suba secretos

## Configurar NPM

Reenvíe Proxy Host a `ufw-app:8088` — consulte [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Verificar

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Abra `APP_URL/setup` en la primera instalación.

## Documentos relacionados

- [GHCR + Compose](./ghcr-compose.md)
- [Resumen de despliegue](./overview.md)
