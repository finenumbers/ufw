# Nginx Proxy Manager

Nginx Proxy Manager (NPM) doit **déjà être installé** sur votre hôte Docker. Ce projet ne déploie pas NPM.

## Flux de trafic

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, réseau Docker)
```

NPM termine HTTPS. L'application définit HSTS en production mais s'appuie sur NPM pour les certificats.

## Checklist Proxy Host

Créez ou mettez à jour un **Proxy Host** dans l'interface NPM :

| Champ | Valeur |
|-------|--------|
| Domain Names | Hôte de `APP_URL` (ex. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recommandé |
| SSL | Let's Encrypt ou certificat existant |
| Force SSL | Recommandé |

## Réseau Docker

Le conteneur de l'application doit rejoindre le **même réseau Docker** que NPM.

Définir dans `.env` :

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` attache `ufw-app` au réseau externe `npm_proxy` → `$NPM_NETWORK`.)

Trouver le nom de votre réseau :

```bash
docker network ls | grep -i proxy
```

## APP_URL doit correspondre

`APP_URL` dans `.env` doit correspondre exactement à l'URL publique (schéma + hôte) :

```bash
APP_URL=https://ufw.example.com
```

Un écart provoque des boucles de redirection d'authentification ou des cookies invalides.

## APP_URL vs schéma Proxy Host

| Couche | Schéma | Exemple |
|--------|--------|---------|
| Navigateur / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → conteneur | **HTTP** | `http://ufw-app:8088` |

NPM termine TLS. Le conteneur de l'application écoute en HTTP simple dans le réseau Docker — c'est **volontaire**, pas une mauvaise configuration.

Définissez `APP_URL` uniquement sur l'URL HTTPS publique. Ne pointez jamais `APP_URL` vers `http://ufw-app:8088`.

## TRUST_PROXY

En exécution derrière NPM, définir dans `.env` ou l'environnement de la stack Portainer :

```bash
TRUST_PROXY=1
```

Cela fait utiliser à `/setup` les limites de débit avec la vraie IP client depuis `X-Forwarded-For`. Voir [Variables d'environnement](../administration/environment-variables.md).

## Build local (sans GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Les mêmes paramètres NPM Proxy Host s'appliquent.

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Dépannage](../troubleshooting.md)
