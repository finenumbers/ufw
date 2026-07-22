# Deployment Portainer

Deploy con **Portainer** usando immagini **GHCR** precompilate dietro **Nginx Proxy Manager** esistente.

NPM non è incluso in questo stack.

## Prerequisiti

- Host Docker con Portainer e NPM in esecuzione
- Immagini GHCR da [releases](https://github.com/finenumbers/ufw/releases) — tag `latest` aggiornato a ogni release; fissate `GHCR_IMAGE_TAG=v0.9.2` se necessario
- Nome rete Docker NPM (es. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Variabili d'ambiente

```bash
./scripts/generate-production-env.sh .env
```

**Obbligatorie:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Opzionali:** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Creare lo stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nome: `ufw-remote-manager`
3. Incollate [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment → **Advanced mode** → incollate segreti `.env`
5. **Deploy the stack**

### Repository Git

1. Repository: `https://github.com/finenumbers/ufw`
2. Percorso Compose: `deploy/portainer.stack.yml`
3. Impostate ambiente nell'UI Portainer — non committate mai segreti

## Configurare NPM

Forward Proxy Host a `ufw-app:8088` — vedi [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Verifica

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Aprite `APP_URL/setup` alla prima installazione.

## Documenti correlati

- [GHCR + Compose](./ghcr-compose.md)
- [Panoramica deployment](./overview.md)
