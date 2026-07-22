# Implantação com Portainer

Implante com **Portainer** usando imagens **GHCR** pré-compiladas atrás do **Nginx Proxy Manager** existente.

NPM não está incluído nesta stack.

## Pré-requisitos

- Host Docker com Portainer e NPM em execução
- Imagens GHCR de [releases](https://github.com/finenumbers/ufw/releases) — tag `latest` atualizada a cada release; fixe `GHCR_IMAGE_TAG=v0.9.2` se necessário
- Nome da rede Docker NPM (ex. `nginxproxymanager_default`)

```bash
docker network ls | grep -i proxy
docker inspect <npm_container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

## Variáveis de ambiente

```bash
./scripts/generate-production-env.sh .env
```

**Obrigatórias:** `APP_URL`, `NPM_NETWORK`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `TRUST_PROXY=1`

**Opcionais:** `GHCR_OWNER`, `GHCR_IMAGE_TAG`, `PORT_SCAN_ENABLED=true`

## Criar stack

### Editor web

1. Portainer → **Stacks** → **Add stack**
2. Nome: `ufw-remote-manager`
3. Cole [`deploy/portainer.stack.yml`](../../../deploy/portainer.stack.yml)
4. Environment → **Advanced mode** → cole segredos do `.env`
5. **Deploy the stack**

### Repositório Git

1. Repositório: `https://github.com/finenumbers/ufw`
2. Compose path: `deploy/portainer.stack.yml`
3. Defina environment na UI do Portainer — nunca commite segredos

## Configurar NPM

Encaminhe Proxy Host para `ufw-app:8088` — veja [Nginx Proxy Manager](./nginx-proxy-manager.md).

## Verificar

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

Abra `APP_URL/setup` na primeira instalação.

## Documentos relacionados

- [GHCR + Compose](./ghcr-compose.md)
- [Visão geral de implantação](./overview.md)
