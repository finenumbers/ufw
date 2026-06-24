# Atualização e rollback

Stack: `ufw-postgres`, `ufw-migrate` (execução única), `ufw-app`. As imagens são universais — defina `APP_URL` no `.env` em tempo de execução.

## Antes de cada atualização

1. [Backup](./backup-restore.md) do Postgres e do `.env`
2. Registre a tag de imagem atual: `grep IMAGE_TAG .env`
3. Leia as [notas de release](https://github.com/finenumbers/ufw/releases)

## Atualização (GHCR + Compose)

1. Atualize o `.env`:

```bash
IMAGE_TAG=v0.2.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.2.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.2.0
```

2. Baixe e reimplante:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

3. Verifique: `docker logs ufw-migrate` (exit 0) e `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

As migrações rodam automaticamente via `ufw-migrate`.

## Atualização (Portainer)

Atualize `GHCR_*_IMAGE` no ambiente da stack → **Atualizar a stack** (Pull & redeploy).

## Rollback

Migrações Prisma são somente para frente. Se uma nova versão aplicou alterações de schema irreversíveis, **restaure o Postgres a partir do backup pré-atualização** — não reverta apenas a tag da imagem.

Rollback seguro apenas de imagem (sem migração destrutiva):

1. Reverta as tags de imagem no `.env` para a versão anterior
2. `docker compose ... pull && docker compose ... up -d`
3. Teste de fumaça

## Alterar APP_URL (mudança de domínio)

1. Atualize o Proxy Host no NPM
2. Altere `APP_URL` no `.env`
3. `docker compose ... up -d app`

Não é necessário rebuild de imagem. Usuários podem precisar entrar novamente.

## Documentação relacionada

- [Backup e restauração](./backup-restore.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
