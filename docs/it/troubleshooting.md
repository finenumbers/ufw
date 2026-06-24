# Risoluzione problemi

Sintomo → causa probabile → cosa fare.

## Autenticazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Loop di redirect al login | `APP_URL` non corrisponde all'URL del browser | Imposta `APP_URL` all'URL HTTPS pubblico esatto; riavvia l'app |
| Login funziona in locale ma non via dominio | NPM o flag cookie secure | Forza SSL in NPM; verifica che lo schema di `APP_URL` sia `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` non caricato | Usa `--env-file .env` in compose |

## Docker / NPM

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| NPM 502 Bad Gateway | App non sulla rete NPM | Imposta `NPM_NETWORK`; verifica che `ufw-app` si unisca alla rete esterna |
| `ufw-app` unhealthy | DB down o segreti mancanti | Controlla `docker logs ufw-app`, salute postgres |
| `ufw-migrate` failed | Errore di migrazione | Leggi `docker logs ufw-migrate`; ripristina backup se necessario |
| `pull access denied` | Pacchetto GHCR privato | Imposta visibilità Public del pacchetto o `docker login ghcr.io` |

## SSH

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Test SSH fallito | Credenziali errate, firewall, host down | Verifica identità, porta, server consente IP host Docker |
| Errore validazione host | IP privato bloccato | Imposta `SSH_ALLOWED_CIDRS` per reti interne |
| Chiave host cambiata | Reinstallazione server o MITM | Verifica impronta sul server; aggiorna dopo conferma |
| Chiave host non verificata | Importata dalla configurazione | Esegui test SSH dalla pagina modifica server |

## Regole / applicazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Pagina regole vuota / disabilitata | UFW non attivo | Installa e attiva UFW dalla dashboard |
| Anteprima mostra eliminazioni inattese | Deriva della bozza | Risincronizzazione forzata dal server |
| Avviso applicazione parziale | Applicazione precedente interrotta | Risincronizza; controlla manualmente `ufw status` remoto |
| Bloccato fuori da SSH | Applicata regola deny | Accesso console/out-of-band; correggi UFW sul server direttamente |

## Dati

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Credenziali non valide dopo ripristino | `APP_ENCRYPTION_KEY` errata | Ripristina `.env` corrispondente dal backup |
| Impossibile decrittografare identità | Rotazione chiave senza reinserimento | Reinserisci segreti o ripristina export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Atteso: `{"status":"ok","db":"ok"}`

## Ancora bloccato?

Scrivi a **[apps@finenumbers.com](mailto:apps@finenumbers.com)** con tag versione, log sanitizzati (senza segreti) e passi per riprodurre.
