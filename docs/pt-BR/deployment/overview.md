# Visão geral de implantação

Escolha como executar o UFW Remote Manager em produção. Todos os caminhos usam Docker; PostgreSQL é obrigatório.

## Caminho recomendado

**Imagens pré-compiladas GHCR + overlays Compose + Nginx Proxy Manager**

```bash
./scripts/generate-production-env.sh .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Veja [GHCR + Compose](./ghcr-compose.md) e [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Métodos de implantação

| Método | Quando usar | Build no servidor? |
|--------|-------------|-------------------|
| **GHCR + Compose** | Produção padrão | Não — `docker compose pull` |
| **Build Compose local** | Air-gapped ou fork de desenvolvimento | Sim — `docker compose build` |
| **Stack Portainer** | Ops orientadas a GUI | Opcional — usa GHCR ou build |

## Camadas de arquivos Compose

| Arquivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Base: postgres, migrate, app |
| `docker-compose.prod.yml` | Produção: sem portas publicadas, rede NPM, env prod |
| `docker-compose.ghcr.yml` | Pull de imagens GHCR em vez de build local |

Combine com flags `-f`. Sempre passe `--env-file .env` em produção.

## Container de migration

A cada `up`, **ufw-migrate** executa `prisma migrate deploy` uma vez e encerra. **Não** execute `prisma migrate` manualmente dentro do **ufw-app** — use o serviço migrate:

```bash
docker compose run --rm migrate
```

v0.9.2 **não tem nova migration** além de releases anteriores — upgrade é pull e up.

## Recursos opcionais no deploy

| Recurso | Habilitar |
|---------|-----------|
| Varredura de portas | `PORT_SCAN_ENABLED=true` — veja [Varredura externa de portas](./port-scan.md) |
| Destinos SSH privados | `SSH_ALLOWED_CIDRS=10.0.0.0/8,...` |

Monitor de containers Docker foi **removido na v0.9.0** — sem flag de env.

## Fixação de versão

| Estratégia | Configuração |
|------------|--------------|
| Acompanhar último release | `GHCR_IMAGE_TAG=latest` (padrão) |
| Fixar versão | `GHCR_IMAGE_TAG=v0.9.2` |

## Documentos relacionados

- [GHCR + Compose](./ghcr-compose.md)
- [Portainer](./portainer.md)
- [Variáveis de ambiente](../administration/environment-variables.md)
- [Atualização e rollback](../operations/upgrade-rollback.md)
