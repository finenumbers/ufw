# Nginx Proxy Manager

O Nginx Proxy Manager (NPM) deve **já estar instalado** no seu host Docker. Este projeto não implanta NPM.

## Fluxo de tráfego

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, rede Docker)
```

NPM termina HTTPS. O app define HSTS em produção mas depende do NPM para certificados.

## Checklist Proxy Host

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (ex. `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recommended |
| SSL | Let's Encrypt or existing certificate |
| Force SSL | Recommended |

## Rede Docker

O container do app deve participar da **mesma rede Docker** que o NPM.

```bash
NPM_NETWORK=nginxproxymanager_default
```

`docker-compose.prod.yml` anexa `ufw-app` à rede externa de `$NPM_NETWORK`.

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corresponder

```bash
APP_URL=https://ufw.example.com
```

Deve corresponder exatamente ao domínio do Proxy Host NPM (scheme + host). Cookies Better Auth dependem disso.

## HTTP interno é intencional

NPM termina TLS. Tráfego NPM → `ufw-app:8088` é HTTP não criptografado na rede Docker — **por design**, não misconfiguration.

**Não** defina `APP_URL` para `http://ufw-app:8088`.

## TRUST_PROXY

Defina no ambiente do app quando atrás do NPM:

```env
TRUST_PROXY=1
```

Garante que limites de setup usem IP real do cliente de `X-Forwarded-For`.

## Alternativa build local

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Mesmo checklist NPM se aplica.

## Documentos relacionados

- [Variáveis de ambiente](../administration/environment-variables.md)
- [GHCR + Compose](./ghcr-compose.md)
