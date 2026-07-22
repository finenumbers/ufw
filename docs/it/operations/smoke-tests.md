# Smoke test

Eseguite dopo deploy, aggiornamento o disaster recovery.

## Script automatizzato

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url https://ufw.example.com
```

| Flag | Scopo |
|------|---------|
| `--env-file .env` | Carica variabili produzione |
| `--ghcr` | Include `docker-compose.ghcr.yml` |
| `--app-url URL` | Controlla `/api/health` HTTPS pubblico |

Verifica: Postgres healthy, migrate uscito 0, app healthy, JSON health include versione.

## Health check manuale

```bash
docker compose --env-file .env ps
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

## Checklist browser

1. `APP_URL/login` — autenticatevi
2. **Identità SSH** — create o verificate identità
3. **Server** — create/aggiornate; verifica SSH riesce
4. **Aggiorna stato** — snapshot UFW creato
5. **Regole** — anteprima apply gira; conferma opzionale su server test
6. **Cronologia operazioni** — voci recenti visibili
7. **Sync iniziale** — server nuovo senza snapshot ottiene sync background
8. **Scansione porte** (se abilitata) — avviate scan; refresh pagina a metà scan — pannello riprende (v0.9.2)
9. **Apply** — dopo conferma, conteggio regole corrisponde al remoto

## Prima installazione

Usate `APP_URL/setup` una volta per creare account admin.

## Documenti correlati

- [Configurazione iniziale](../user-guide/initial-setup.md)
- [Gestire i server](../user-guide/manage-servers.md)
