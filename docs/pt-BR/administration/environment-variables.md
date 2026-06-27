# Variáveis de ambiente

A configuração em tempo de execução é fornecida via `.env` (Compose) ou interface de ambiente do Portainer. **Nunca faça commit de valores reais no git.**

## Obrigatórias (produção)

| Variável | Descrição | Gerar |
|----------|-------------|----------|
| `APP_URL` | URL pública da interface de administração (HTTPS para domínios reais) | Seu domínio NPM, ex.: `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Senha do banco de dados | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Segredo de assinatura de sessão (**mín. 32 caracteres** em produção) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chave AES para credenciais SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nome da rede Docker compartilhada com o NPM | `docker network ls` |

## Implantação GHCR (opcional)

Compose e stack Portainer usam por padrão `ghcr.io/finenumbers/ufw-remote-manager:latest`. Cada release do GitHub atualiza a tag `latest`.

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GHCR_OWNER` | Proprietário GitHub (minúsculas) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag da imagem (`latest` ou fixar ex.: `v0.2.1`) | `latest` |

As variáveis legadas `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` não são mais obrigatórias — as URLs das imagens são montadas a partir de owner + tag nos arquivos compose.

## Opcionais

| Variável | Descrição | Padrão |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDRs separados por vírgula permitidos como destinos SSH | Vazio (IPs privados bloqueados) |
| `TRUST_PROXY` | Defina como `1` quando a aplicação roda atrás do Nginx Proxy Manager para que os limites de taxa do setup usem `X-Forwarded-For` | Não definido (cabeçalhos encaminhados ignorados) |
| `APP_BIND` | Endereço de bind do compose local | `127.0.0.1` |
| `APP_PORT` | Porta do host para compose local | `8088` |
| `POSTGRES_PORT` | Porta do host para Postgres em dev | `5434` |
| `LOG_LEVEL` | Nível de log Pino | `info` |

## Limites de taxa (fixos)

Server actions repetidas usam cooldown de **30 segundos** por servidor (não configurável por variáveis de ambiente):

- Atualização de status UFW e sync de regras
- Início de varredura de portas
- Atualização do inventário Docker
- Start, stop e restart de contêineres Docker

Desde **v0.5.1**, variáveis legadas como `PORT_SCAN_RATE_LIMIT_WINDOW_MS`, `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` e `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` são **ignoradas** se ainda estiverem no `.env`.

Buckets de limite de taxa em memória são removidos quando vazios (somente implantação com réplica única — veja [Arquitetura](../architecture.md)).

## APP_URL vs HTTP interno

Duas URLs diferentes cumprem papéis distintos:

| Configuração | Exemplo | Finalidade |
|---------|---------|---------|
| **`APP_URL`** | `https://ufw.example.com` | URL pública para Better Auth, cookies e redirecionamentos do navegador |
| **Esquema do Proxy Host NPM** | `http` → `ufw-app:8088` | Tráfego Docker interno; NPM termina TLS |

**Não** defina `APP_URL` como a URL interna do container. O Better Auth exige o domínio HTTPS público que os usuários digitam no navegador.

Em produção, `APP_URL` deve usar **HTTPS** para hostnames reais. As únicas exceções são `http://localhost` e `http://127.0.0.1` (smoke tests locais e CI).

## Produção atrás do NPM

Quando `ufw-app` fica atrás do Nginx Proxy Manager em uma rede Docker compartilhada:

1. Defina `TRUST_PROXY=1` no ambiente da aplicação para que os limites de taxa de `/setup` usem o IP do cliente de `X-Forwarded-For` (o NPM define esse cabeçalho).
2. Sem `TRUST_PROXY`, os limites de setup usam um bucket compartilhado único (`direct`) — aceitável para dev local, não ideal para produção.

## Como as variáveis chegam aos containers

Em `docker-compose.yml`:

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

A aplicação lê `APP_URL` ou `BETTER_AUTH_URL` em tempo de execução (`getPublicAppUrl()`).

## Modelos e geradores

- [`.env.example`](../../../.env.example) — desenvolvimento local
- [`.env.production.example`](../../../.env.production.example) — modelo de produção
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — gerador interativo

## Documentação relacionada

- [Modelo de segurança](./security-model.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
