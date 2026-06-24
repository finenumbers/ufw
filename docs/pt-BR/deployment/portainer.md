# Implantação com Portainer

Implante com **Portainer** usando imagens **GHCR** pré-compiladas atrás do **Nginx Proxy Manager** existente.

O NPM não está incluído nesta stack.

## Pré-requisitos

- Host Docker com Portainer e NPM em execução
- Imagens GHCR dos [releases](https://github.com/finenumbers/ufw/releases)
- Nome da rede Docker do NPM (ex.: `nginxproxymanager_default`)

Encontrar a rede do NPM:

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Preparar variáveis de ambiente

```bash
./scripts/generate-production-env.sh .env
```

Ou copie [`.env.production.example`](../../../.env.production.example).

Obrigatórias: `APP_URL`, `NPM_NETWORK`, `GHCR_APP_IMAGE`, `GHCR_MIGRATE_IMAGE`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`.

## Criar stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nome: `ufw-remote-manager`
3. Cole [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment variables → **Advanced mode** → cole o conteúdo do `.env`
5. **Implantar a stack**

### Repositório Git

1. Repository URL: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Defina o ambiente na interface do Portainer (nunca faça commit de segredos no git)

## Configurar NPM

Veja [Nginx Proxy Manager](./nginx-proxy-manager.md) — encaminhe para `ufw-app:3000`.

## Verificar

1. Containers da stack saudáveis; `ufw-migrate` exited 0
2. Navegador → `APP_URL/setup` ou `/login`
3. `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Atualização e backup

- [Atualização e rollback](../operations/upgrade-rollback.md)
- [Backup e restauração](../operations/backup-restore.md)

## Documentação relacionada

- [GHCR + Compose](./ghcr-compose.md)
- [Modelo de segurança](../administration/security-model.md)
