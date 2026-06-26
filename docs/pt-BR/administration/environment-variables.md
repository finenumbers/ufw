# Variáveis de ambiente

A configuração em tempo de execução é fornecida via `.env` (Compose) ou interface de ambiente do Portainer. **Nunca faça commit de valores reais no git.**

## Obrigatórias (produção)

| Variável | Descrição | Gerar |
|----------|-------------|----------|
| `APP_URL` | URL HTTPS pública da interface de administração | Seu domínio NPM, ex.: `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Senha do banco de dados | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Segredo de assinatura de sessão | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chave AES para credenciais SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Nome da rede Docker compartilhada com o NPM | `docker network ls` |

## Implantação GHCR (opcional)

Compose e stack Portainer usam por padrão `ghcr.io/finenumbers/ufw-remote-manager:latest`. Cada release do GitHub atualiza a tag `latest`.

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GHCR_OWNER` | Proprietário GitHub (minúsculas) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag da imagem (`latest` ou ex.: `v0.2.1`) | `latest` |

## Opcionais

| Variável | Descrição | Padrão |
|----------|-------------|---------|
| `SSH_ALLOWED_CIDRS` | CIDRs separados por vírgula permitidos como destinos SSH | Vazio (IPs privados bloqueados) |
| `APP_BIND` | Endereço de bind do compose local | `127.0.0.1` |
| `APP_PORT` | Porta do host para compose local | `8088` |
| `POSTGRES_PORT` | Porta do host para Postgres em dev | `5434` |
| `LOG_LEVEL` | Nível de log Pino | `info` |

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
