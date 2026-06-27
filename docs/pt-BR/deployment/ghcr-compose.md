# GHCR + Docker Compose

As imagens de produção são publicadas no **GitHub Container Registry (GHCR)**:

| Imagem | Propósito |
|--------|-----------|
| `ghcr.io/finenumbers/ufw-remote-manager:TAG` | App Next.js |
| `ghcr.io/finenumbers/ufw-remote-manager-migrate:TAG` | Migrações Prisma (execução única) |

Cada release publica **`latest`** mais tags de versão (ex.: `v0.6.1`, `0.6.1`). Deploys de produção usam **`latest`** por padrão — nenhuma versão necessária em `.env`.

Substitua `finenumbers` pelo proprietário do seu fork se usar um fork (`GHCR_OWNER` em `.env`).

## Imagens universais — APP_URL em runtime

As imagens são **agnósticas ao domínio**. Defina `APP_URL` em `.env` para sua URL HTTPS pública. Nenhum build por domínio necessário.

## Obter imagens

### Opção A — Release por tag Git (recomendado)

```bash
git tag v0.7.3
git push origin v0.7.3
```

GitHub Actions publica imagens tagueadas e atualiza `latest`. Os pacotes devem ser **Public** no primeiro uso (GitHub → Packages → configurações).

### Opção B — Release (dispatch)

Actions → **Release (dispatch)** → informar `image_tag` (tag personalizada; não atualiza `latest` a menos que você tagueie `latest` manualmente).

## Preparar `.env` no servidor

```bash
cp .env.production.example .env
# or
./scripts/generate-production-env.sh .env
```

Exemplo (segredos obrigatórios; vars de imagem opcionais):

```bash
APP_URL=https://ufw.example.com
NPM_NETWORK=nginxproxymanager_default
POSTGRES_PASSWORD=...
BETTER_AUTH_SECRET=...
APP_ENCRYPTION_KEY=...
# Optional: GHCR_OWNER=finenumbers  GHCR_IMAGE_TAG=latest
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

Configurar NPM — veja [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Atualização

Reimplantar com `docker compose ... pull && up -d` — sem alterações em `.env` ao usar `latest`.

Veja [Atualização e rollback](../operations/upgrade-rollback.md) para fixar uma versão.

## Solução de problemas

| Sintoma | Verificar |
|---------|-----------|
| Loops de redirecionamento auth | `APP_URL` corresponde exatamente à URL pública NPM |
| `pull access denied` | Visibilidade do pacote Public, ou `docker login ghcr.io` |
| `APP_URL is required` | `.env` carregado com `--env-file .env` |
| NPM 502 | App na rede `npm_proxy`; nome do container `ufw-app` |

## Documentação relacionada

- [Visão geral de implantação](./overview.md)
- [Testes smoke](../operations/smoke-tests.md)
