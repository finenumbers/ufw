# Nginx Proxy Manager

O Nginx Proxy Manager (NPM) deve **já estar instalado** no seu host Docker. Este projeto não implanta o NPM.

## Fluxo de tráfego

```
Internet → NPM:443 (TLS) → ufw-app:3000 (HTTP, rede Docker)
```

O NPM termina HTTPS. A aplicação define HSTS em produção, mas depende do NPM para certificados.

## Checklist de Proxy Host

Crie ou atualize um **Proxy Host** na interface do NPM:

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (ex.: `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `3000` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recomendado |
| SSL | Let's Encrypt ou certificado existente |
| Force SSL | Recomendado |

## Rede Docker

O container da aplicação deve entrar na **mesma rede Docker** que o NPM.

Defina no `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` anexa `ufw-app` à rede externa `npm_proxy` → `$NPM_NETWORK`.)

Encontre o nome da sua rede:

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corresponder

`APP_URL` no `.env` deve corresponder exatamente à URL pública (esquema + host):

```bash
APP_URL=https://ufw.example.com
```

Incompatibilidade causa loops de redirecionamento de autenticação ou cookies quebrados.

## Build local (sem GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

As mesmas configurações de Proxy Host do NPM se aplicam.

## Documentação relacionada

- [Visão geral da implantação](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Solução de problemas](../troubleshooting.md)
