# Testes de fumaça

Execute após implantação, atualização ou recuperação de desastre.

## Script automatizado

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Flags:

| Flag | Finalidade |
|------|---------|
| `--env-file .env` | Carrega variáveis de produção (exige `NPM_NETWORK` para compose prod) |
| `--ghcr` | Inclui overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Também verifica `/api/health` HTTPS público via curl |

O script verifica:

- Postgres saudável
- `ufw-migrate` exited 0
- `ufw-app` healthy
- `/api/health` interno retorna `{"status":"ok","db":"ok"}`

## Verificação manual de saúde

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist no navegador

1. `APP_URL/login` — autentique-se
2. **Identidades SSH** — identidade existe ou crie uma
3. **Servidores** — Testar SSH tem sucesso
4. **Regras** — Salvar regras roda (confirmação opcional)
5. **Histórico de operações** — entradas recentes visíveis

## Primeira instalação

Use `APP_URL/setup` em vez de `/login` para criar a conta de administrador uma vez.

## Documentação relacionada

- [Configuração inicial](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
