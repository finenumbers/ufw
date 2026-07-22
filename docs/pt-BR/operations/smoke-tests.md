# Testes de fumaça

Execute após deploy, atualização ou recuperação de desastre.

## Script automatizado

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Propósito |
|------|-----------|
| `--env-file .env` | Carregar variáveis de produção |
| `--ghcr` | Incluir `docker-compose.ghcr.yml` |
| `--app-url URL` | Verificar HTTPS público `/api/health` |

Verifica: Postgres healthy, migrate exited 0, app healthy, health JSON inclui versão.

## Health check manual

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist no navegador

1. `APP_URL/login` — autenticar
2. **Identidades SSH** — criar ou verificar identidade
3. **Servidores** — criar/atualizar; verificação SSH ok
4. **Atualizar status** — snapshot UFW criado
5. **Regras** — apply preview executa; confirm opcional em servidor de teste
6. **Histórico de operações** — entradas recentes visíveis
7. **Sync inicial** — servidor novo sem snapshot recebe sync em segundo plano
8. **Varredura de portas** (se habilitada) — iniciar scan; refresh mid-scan — painel retoma (v0.9.2)
9. **Apply** — após confirmar, contagem de regras corresponde ao remoto

## Primeira instalação

Use `APP_URL/setup` uma vez para criar conta admin.

## Documentos relacionados

- [Configuração inicial](../user-guide/initial-setup.md)
- [Gerenciar servidores](../user-guide/manage-servers.md)
