# Nginx Proxy Manager

Nginx Proxy Manager (NPM) doit **déjà être installé** sur votre hôte Docker. Ce projet ne déploie pas NPM.

## Flux de trafic

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, réseau Docker)
```

NPM termine HTTPS. L'application définit HSTS en production mais s'appuie sur NPM pour les certificats.

## Checklist Proxy Host

| Champ | Valeur |
|-------|--------|
| Domain Names | Hôte de `APP_URL` (ex. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Activé** |
| Block Common Exploits | Recommandé |
| SSL | Let's Encrypt ou certificat existant |
| Force SSL | Recommandé |

## Réseau Docker

Le conteneur app doit rejoindre le **même réseau Docker** que NPM.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` attache `ufw-app` au réseau externe depuis `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL doit correspondre

```bash
APP_URL=https://ufw.example.com
```

Doit correspondre exactement au domaine Proxy Host NPM (schéma + hôte). Les cookies Better Auth en dépendent.

## HTTP interne est intentionnel

NPM termine TLS. Le trafic NPM → `ufw-app:8088` est HTTP non chiffré sur le réseau Docker — **voulu**, pas une mauvaise configuration.

Ne **pas** définir `APP_URL` sur `http://ufw-app:8088`.

## TRUST_PROXY

Définir dans l'environnement app derrière NPM :

```env
TRUST_PROXY=1
```

Assure que les limites de débit setup utilisent la vraie IP client depuis `X-Forwarded-For`.

## Alternative build local

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

La même checklist NPM s'applique.

## Documentation associée

- [Variables d'environnement](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
