# Deployment Portainer

Deploy con **Portainer** usando immagini **GHCR** precompilate dietro **Nginx Proxy Manager** esistente.

NPM non è incluso in questo stack.

## Prerequisiti

- Host Docker con Portainer e NPM in esecuzione
- Immagini GHCR dalle [release](https://github.com/finenumbers/ufw/releases)
- Nome rete Docker NPM (es. `nginxproxymanager_default`)

Trova la rete NPM:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Preparare le variabili d'ambiente

```bash
./scripts/generate-production-env.sh .env
```

Oppure copia [`.env.production.example`](../../../.env.production.example).

Obbligatorie: `APP_URL`, `NPM_NETWORK`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

## Creare lo stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nome: `ufw-remote-manager`
3. Incolla [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → incolla contenuto `.env`
5. **Deploy the stack**

### Repository Git

1. URL repository: `https://github.com/finenumbers/ufw`
2. Percorso Compose: `deploy/portainer.stack.yml`
3. Imposta environment nell'interfaccia Portainer (non committare segreti in git)

## Configurare NPM

Vedi [Nginx Proxy Manager](./nginx-proxy-manager.md) — inoltra a `ufw-app:3000`.

## Verifica

1. Container stack healthy; `ufw-migrate` exited 0
2. Browser → `APP_URL/setup` o `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Aggiornamento e backup

- [Aggiornamento e rollback](../operations/upgrade-rollback.md)
- [Backup e ripristino](../operations/backup-restore.md)

## Documentazione correlata

- [GHCR + Compose](./ghcr-compose.md)
- [Modello di sicurezza](../administration/security-model.md)
