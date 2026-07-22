# GHCR + Docker Compose

Baixe imagens pré-compiladas do GitHub Container Registry — recomendado para produção.

## Pré-requisitos

- Docker Compose v2
- `.env` de [`generate-production-env.sh`](../../../scripts/generate-production-env.sh)
- Nginx Proxy Manager na rede Docker compartilhada (`NPM_NETWORK`)

## Nomes das imagens

```
ghcr.io/finenumbers/ufw-remote-manager:${GHCR_IMAGE_TAG:-latest}
ghcr.io/finenumbers/ufw-remote-manager-migrate:${GHCR_IMAGE_TAG:-latest}
```

Cada release GitHub atualiza a tag `latest`. Fixe `GHCR_IMAGE_TAG=v0.9.2` para versões fixas.

## Deploy

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  pull

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

Valide config renderizada:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

## Upgrade

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Migrate executa automaticamente. v0.9.0+ removeu tabelas de inventário legacy — garanta que migrate complete uma vez ao atualizar de versões antigas.

Sem alterações `.env` necessárias ao permanecer em `latest`.

## Smoke test

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Solução de problemas

| Erro | Correção |
|------|----------|
| `pull access denied` | Visibilidade Public do pacote, ou `docker login ghcr.io` |
| Migrate falha | Verifique logs: `docker compose logs migrate` |
| Health check falha | `docker compose logs app`; verifique segredos e `APP_URL` |

## Documentos relacionados

- [Visão geral de implantação](./overview.md)
- [Atualização e rollback](../operations/upgrade-rollback.md)
