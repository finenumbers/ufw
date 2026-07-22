# Variáveis de ambiente

Configuração em tempo de execução via `.env` (Compose) ou UI de ambiente do Portainer. **Nunca commite valores reais no git.**

## Obrigatórias (produção)

| Variável | Descrição | Gerar |
|----------|-----------|-------|
| `APP_URL` | URL HTTPS pública da UI admin | Seu domínio NPM, ex. `https://ufw.example.com` |
| `POSTGRES_PASSWORD` | Senha do banco | `openssl rand -base64 24` |
| `BETTER_AUTH_SECRET` | Assinatura de sessão (**mín. 32 caracteres** em produção) | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | Chave AES para credenciais SSH (32 bytes decodificados) | `openssl rand -base64 32` |
| `NPM_NETWORK` | Rede Docker compartilhada com NPM | `docker network ls` |
| `TRUST_PROXY` | Defina `1` atrás do NPM para limites de setup precisos | `1` |

## Implantação GHCR

Imagem padrão: `ghcr.io/finenumbers/ufw-remote-manager:latest` (atualizada a cada release).

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GHCR_OWNER` | Owner GitHub (minúsculas) | `finenumbers` |
| `GHCR_IMAGE_TAG` | Tag (`latest` ou pin ex. `v0.9.2`) | `latest` |

Fixe `GHCR_IMAGE_TAG=v0.9.2` para deploys reproduzíveis; use `latest` para atualizações automáticas no `pull`.

Legacy `GHCR_APP_IMAGE` / `GHCR_MIGRATE_IMAGE` / `IMAGE_TAG` não são mais usados.

## Varredura de portas (opcional)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT_SCAN_ENABLED` | unset (desabilitado) | Defina `true` para habilitar UI e pipeline |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Máx. portas enviadas ao enriquecimento Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Timeout de descoberta completa (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Timeout de enriquecimento (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Execuções de scan armazenadas por servidor |

Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` é **ignorado**. Scans repetidos usam cooldown fixo de **30 segundos** no código do app.

## SSH e proxy

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SSH_ALLOWED_CIDRS` | empty | CIDRs separados por vírgula permitidos como destinos SSH |
| `TRUST_PROXY` | unset | `1` = confiar em `X-Forwarded-For` para limite de setup |

## Desenvolvimento local

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `APP_BIND` | `127.0.0.1` | Endereço bind do Compose |
| `APP_PORT` | `8088` | Porta do host |
| `POSTGRES_PORT` | `5434` | Porta Postgres do host |
| `LOG_LEVEL` | `info` | Nível de log Pino |

## Removidas / ignoradas (histórico)

| Variável | Status |
|----------|--------|
| Variáveis legacy de inventário de contêineres (pre-v0.9.0) | Ignoradas — recurso removido em v0.9.0 |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | Ignorado desde v0.5.1 |

## Limites de taxa (fixos no código)

Cooldown de 30 segundos por servidor: refresh/sync UFW, início de varredura de portas. Não configurável via env.

Buckets em memória — apenas réplica única. Veja [Arquitetura](../architecture.md).

## APP_URL vs HTTP interno

| Configuração | Exemplo | Propósito |
|--------------|---------|-----------|
| **`APP_URL`** | `https://ufw.example.com` | URL do navegador, cookies Better Auth |
| **NPM → app** | `http://ufw-app:8088` | Tráfego Docker interno |

**Não** defina `APP_URL` para URL interna do container.

Produção exige **HTTPS** em `APP_URL` exceto `localhost` / `127.0.0.1`.

## Como variáveis chegam aos containers

```yaml
APP_URL: ${APP_URL:-http://localhost:8088}
BETTER_AUTH_URL: ${APP_URL:-http://localhost:8088}
```

O app lê `APP_URL` ou `BETTER_AUTH_URL` via `getPublicAppUrl()`.

## Templates

- [`.env.example`](../../../.env.example) — desenvolvimento local
- [`.env.production.example`](../../../.env.production.example) — template de produção
- [`scripts/generate-production-env.sh`](../../../scripts/generate-production-env.sh) — gerador interativo

## Documentos relacionados

- [Modelo de segurança](./security-model.md)
- [Varredura externa de portas](../deployment/port-scan.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
