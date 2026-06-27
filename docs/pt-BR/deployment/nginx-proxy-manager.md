# Nginx Proxy Manager

O Nginx Proxy Manager (NPM) deve **já estar instalado** no seu host Docker. Este projeto não implanta o NPM.

## Fluxo de tráfego

```
Internet → NPM:443 (TLS) → ufw-app:8088 (HTTP, rede Docker)
```

O NPM termina HTTPS. O app define HSTS em produção, mas depende do NPM para certificados.

## Checklist Proxy Host

Crie ou atualize um **Proxy Host** na interface do NPM:

| Campo | Valor |
|-------|-------|
| Domain Names | Host de `APP_URL` (ex.: `ufw.example.com`) |
| Scheme | `http` |
| Forward Hostname / IP | `ufw-app` |
| Forward Port | `8088` |
| Websockets Support | **Enabled** |
| Block Common Exploits | Recomendado |
| SSL | Let's Encrypt ou certificado existente |
| Force SSL | Recomendado |

## Rede Docker

O container do app deve entrar na **mesma rede Docker** que o NPM.

Definir em `.env`:

```bash
NPM_NETWORK=nginxproxymanager_default
```

(`docker-compose.prod.yml` conecta `ufw-app` à rede externa `npm_proxy` → `$NPM_NETWORK`.)

Encontrar o nome da sua rede:

```bash
docker network ls | grep -i proxy
```

## APP_URL deve corresponder

`APP_URL` em `.env` deve corresponder exatamente à URL pública (esquema + host):

```bash
APP_URL=https://ufw.example.com
```

Discrepância causa loops de redirecionamento de auth ou cookies inválidos.

## APP_URL vs esquema Proxy Host

| Camada | Esquema | Exemplo |
|--------|---------|---------|
| Navegador / `APP_URL` | **HTTPS** | `https://ufw.example.com` |
| NPM → container | **HTTP** | `http://ufw-app:8088` |

O NPM termina TLS. O container do app escuta HTTP sem criptografia na rede Docker — isso é **intencional**, não uma má configuração.

Defina `APP_URL` apenas para a URL HTTPS pública. Nunca aponte `APP_URL` para `http://ufw-app:8088`.

## TRUST_PROXY

Ao executar atrás do NPM, definir em `.env` ou ambiente da stack Portainer:

```bash
TRUST_PROXY=1
```

Isso faz com que os limites de taxa em `/setup` usem o IP real do cliente de `X-Forwarded-For`. Veja [Variáveis de ambiente](../administration/environment-variables.md).

## Build local (sem GHCR)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

As mesmas configurações de NPM Proxy Host se aplicam.

## Documentação relacionada

- [Visão geral de implantação](./overview.md)
- [GHCR + Compose](./ghcr-compose.md)
- [Solução de problemas](../troubleshooting.md)
