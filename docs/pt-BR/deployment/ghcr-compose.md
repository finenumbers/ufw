# GHCR + Docker Compose

Imagens de produção são publicadas no **GitHub Container Registry (GHCR)**:

| Imagem | Finalidade |
|-------|---------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | Aplicação Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrações Prisma (execução única) |

Substitua `finenumbers` pelo proprietário do seu fork se usar um fork.

## Imagens universais — APP_URL em tempo de execução

As imagens são **agnósticas de domínio**. Defina `APP_URL` no `.env` com sua URL HTTPS pública. Não é necessário build por domínio.

## Obter imagens

### Opção A — Release por tag Git (recomendado)

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions publica as imagens com tag. Os pacotes devem estar **Public** no primeiro uso (GitHub → Packages → settings).

### Opção B — Release (dispatch)

Actions → **Release (dispatch)** → informe `image_tag` (ex.: `v0.1.0-prod`).

## Preparar `.env` no servidor

```bash
cp .env.production.example .env
# ou
./scripts/generate-production-env.sh .env
```

Exemplo:

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
GHCR_OWNER=finenumbers
IMAGE_TAG=v0.1.0
GHCR_APP_IMAGE=ghcr.io/finenumbers/ufw-remote-manager:v0.1.0
GHCR_MIGRATE_IMAGE=ghcr.io/finenumbers/ufw-remote-manager-migrate:v0.1.0
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
```

Gerar segredos:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET, APP_ENCRYPTION_KEY
openssl rand -base64 24   # POSTGRES_PASSWORD
```

## Implantar

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

Validar:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env config
```

Configure o NPM — veja [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Atualizar

Veja [Atualização e rollback](../operations/upgrade-rollback.md).

## Solução de problemas

| Sintoma | Verificar |
|---------|-------|
| Loops de redirecionamento de auth | `APP_URL` corresponde exatamente à URL pública do NPM |
| `pull access denied` | Visibilidade do pacote Public, ou `docker login ghcr.io` |
| `APP_URL is required` | `.env` carregado com `--env-file .env` |
| NPM 502 | App na rede `npm_proxy`; nome do container `ufw-app` |

## Documentação relacionada

- [Visão geral da implantação](./overview.md)
- [Testes de fumaça](../operations/smoke-tests.md)
