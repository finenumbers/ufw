# Atualização e rollback

## Atualização (recomendado)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

O serviço **migrate** executa `prisma migrate deploy` automaticamente.

Verifique:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Notas de versão

| Versão | Migration | Alterações notáveis |
|--------|-----------|---------------------|
| **v0.9.0** | Sim — remove tabelas de inventário legacy | UI de inventário legacy removida |
| **v0.9.1** | Não | Limpeza legacy, guardrails de docs |
| **v0.9.2** | Não | Correção sync apply, ciclo de vida do banner de operações, varredura de portas fora da fila SSH, guarda de sobreposição |

Ao atualizar de pré-v0.9.0, garanta que migrate complete — dados de inventário legacy purgados.

Fixe imagem: `GHCR_IMAGE_TAG=v0.9.2` no `.env`.

## Rollback

1. Defina `GHCR_IMAGE_TAG` para tag anterior conhecida como boa
2. `docker compose ... pull && up -d`
3. Se migration já aplicada forward-only, restore de backup DB mais antigo pode ser necessário — teste rollback em staging

Migrations de banco geralmente **não** são revertidas automaticamente.

## Zero-downtime

App de container único — espere breve restart durante `up -d`. Agende janela de manutenção para produção.

## Documentos relacionados

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Backup e restauração](./backup-restore.md)
