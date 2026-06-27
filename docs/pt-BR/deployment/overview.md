# Visão geral de implantação

Escolha como executar o UFW Remote Manager em produção. Todos os caminhos assumem **HTTPS** via um proxy reverso existente (Nginx Proxy Manager recomendado).

![Fluxo de implantação](../../assets/deploy-flow.svg)

## Comparação

| Método | Ideal para | Construir imagens? |
|--------|------------|-------------------|
| [GHCR + Compose](./ghcr-compose.md) | A maioria dos self-hosters | Não — pull do GitHub Packages |
| [Portainer](./portainer.md) | Gestão de stack via GUI | Não — pull de imagens GHCR |
| Build Compose local | Desenvolvimento air-gapped ou fork | Sim — `docker compose build` |

O Nginx Proxy Manager é **sempre externo** — não incluído neste repositório.

## Serviços da stack

| Container | Propósito |
|-----------|-----------|
| `ufw-postgres` | Banco de dados |
| `ufw-migrate` | Executa migrações BD uma vez por deploy |
| `ufw-app` | Aplicação web (inclui Naabu/Nmap quando varredura de portas está ativada) |

## Caminho de produção recomendado

1. Pull da tag de imagem **`latest`** (ou fixar ex.: `v0.6.1`) do GHCR
2. Gerar `.env` no servidor: `./scripts/generate-production-env.sh .env`
3. Implantar com Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configurar NPM Proxy Host → `ufw-app:8088`
5. Abrir `APP_URL/setup`, criar admin
6. Executar `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`
7. Opcional: ativar [varredura de portas externa](./port-scan.md) com `PORT_SCAN_ENABLED=true`
8. Opcional: ativar [monitoramento de containers Docker](./docker-monitor.md) com `DOCKER_MONITOR_ENABLED=true`

## Imagens universais

Defina `APP_URL` em `.env` no deploy. A mesma imagem GHCR funciona para qualquer domínio — sem build de imagem por cliente.

## Disciplina de segredos

- Gerar segredos apenas no servidor
- Modo de arquivo `600` para `.env`
- Nunca armazenar segredos no repositório git da stack Portainer ou tickets públicos

## Documentação relacionada

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variáveis de ambiente](../administration/environment-variables.md)
- [Testes smoke](../operations/smoke-tests.md)
