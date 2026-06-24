# Visão geral da implantação

Escolha como executar o UFW Remote Manager em produção. Todos os caminhos assumem **HTTPS** via um proxy reverso existente (Nginx Proxy Manager recomendado).

![Fluxo de implantação](../../assets/deploy-flow.svg)

## Comparação

| Método | Melhor para | Compilar imagens? |
|--------|----------|---------------|
| [GHCR + Compose](./ghcr-compose.md) | Maioria dos auto-hospedeiros | Não — baixar do GitHub Packages |
| [Portainer](./portainer.md) | Gerenciamento de stack por GUI | Não — baixar imagens GHCR |
| Compose local com build | Ambientes isolados ou desenvolvimento de fork | Sim — `docker compose build` |

O Nginx Proxy Manager é **sempre externo** — não está incluído neste repositório.

## Serviços da stack

| Container | Finalidade |
|-----------|---------|
| `ufw-postgres` | Banco de dados |
| `ufw-migrate` | Executa migrações do BD uma vez por implantação |
| `ufw-app` | Aplicação web |

## Caminho recomendado para produção

1. Baixe a tag de imagem `v0.1.0` (ou último release) do GHCR
2. Gere `.env` no servidor: `./scripts/generate-production-env.sh .env`
3. Implante com Compose + `docker-compose.prod.yml` + `docker-compose.ghcr.yml`
4. Configure Proxy Host no NPM → `ufw-app:3000`
5. Abra `APP_URL/setup`, crie o administrador
6. Execute `./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"`

## Imagens universais

Defina `APP_URL` no `.env` no momento da implantação. A mesma imagem GHCR funciona para qualquer domínio — sem build de imagem por cliente.

## Disciplina de segredos

- Gere segredos apenas no servidor
- Modo de arquivo `600` para `.env`
- Nunca armazene segredos no repositório git da stack do Portainer ou em tickets públicos

## Documentação relacionada

- [Nginx Proxy Manager](./nginx-proxy-manager.md)
- [Variáveis de ambiente](../administration/environment-variables.md)
- [Testes de fumaça](../operations/smoke-tests.md)
