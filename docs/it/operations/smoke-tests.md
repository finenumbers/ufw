# Smoke test

Eseguire dopo deploy, aggiornamento o disaster recovery.

## Script automatizzato

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

Flag:

| Flag | Scopo |
|------|-------|
| `--env-file .env` | Caricare variabili produzione (richiede `NPM_NETWORK` per compose prod) |
| `--ghcr` | Includere overlay `docker-compose.ghcr.yml` |
| `--app-url URL` | Verificare anche `/api/health` HTTPS pubblico via curl |

Lo script verifica:

- Postgres healthy
- `ufw-migrate` exited 0
- `ufw-app` healthy
- `/api/health` interno restituisce `{"status":"ok","db":"ok","version":"…"}` (`revision` solo fuori produzione)

## Controllo salute manuale

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist browser

1. `APP_URL/login` — autenticarsi
2. **Identità SSH** — identità esistente o crearne una
3. **Server** — test SSH riuscito
4. **Regole** — anteprima applicazione eseguita (conferma opzionale)
5. **Cronologia operazioni** — voci recenti visibili

## Prima installazione

Usare `APP_URL/setup` invece di `/login` per creare l'account admin una volta.

## Documentazione correlata

- [Configurazione iniziale](../user-guide/initial-setup.md)
- [GHCR + Compose](../deployment/ghcr-compose.md)
