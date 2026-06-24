# Despliegue con Portainer

Despliegue con **Portainer** usando imágenes **GHCR** precompiladas detrás de **Nginx Proxy Manager** existente.

NPM no está incluido en este stack.

## Requisitos previos

- Host Docker con Portainer y NPM en ejecución
- Imágenes GHCR de [releases](https://github.com/finenumbers/ufw/releases)
- Nombre de red Docker de NPM (p. ej. `nginxproxymanager_default`)

Encuentre la red de NPM:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Preparar variables de entorno

```bash
./scripts/generate-production-env.sh .env
```

O copie [`.env.production.example`](../../../.env.production.example).

Obligatorias: `APP_URL`, `NPM_NETWORK`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

## Crear stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nombre: `ufw-remote-manager`
3. Pegue [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → pegue el contenido de `.env`
5. **Deploy the stack**

### Repositorio Git

1. Repository URL: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Configure el entorno en la interfaz de Portainer (nunca suba secretos a git)

## Configurar NPM

Consulte [Nginx Proxy Manager](./nginx-proxy-manager.md) — reenvíe a `ufw-app:8088`.

## Verificar

1. Contenedores del stack healthy; `ufw-migrate` exited 0
2. Navegador → `APP_URL/setup` o `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Actualización y copia de seguridad

- [Actualización y reversión](../operations/upgrade-rollback.md)
- [Copia de seguridad y restauración](../operations/backup-restore.md)

## Documentación relacionada

- [GHCR + Compose](./ghcr-compose.md)
- [Modelo de seguridad](../administration/security-model.md)
