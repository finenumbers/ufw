# Testes smoke

Executar após deploy, atualização ou disaster recovery.

## Script automatizado

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Flags:

| Flag | Propósito |
|------|-----------|
| `--env-file .env` | Carregar variáveis de produção (requer `NPM_NETWORK` para compose prod) |
| `--ghcr` | Incluir overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Verificar também `/api/health` HTTPS público via curl |

O script verifica:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- `/api/health` interno retorna `{"status":"ok","db":"ok","version":"…"}` (`revision` apenas fora de produção)

## Verificação de saúde manual

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist do navegador

1. `APP_URL/login` — autenticar
2. **Identidades SSH** — identidade existente ou criar uma
3. **Servidores** — verificação SSH ao salvar bem-sucedida
4. **Regras** — pré-visualização de aplicação executada (confirmação opcional)
5. **Histórico de operações** — entradas recentes visíveis

## Primeira instalação

Use `APP_URL/setup` em vez de `/login` para criar a conta admin uma vez.

## Documentação relacionada

- [Configuração inicial](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
