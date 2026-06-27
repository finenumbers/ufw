# Risoluzione problemi

Sintomo → causa probabile → cosa fare.

## Autenticazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Loop di redirect al login | `APP_URL` non corrisponde all'URL del browser | Impostare `APP_URL` sull'URL HTTPS pubblico esatto; riavviare l'app |
| Login ok in locale ma non via dominio | NPM o flag cookie secure | Forzare SSL in NPM; verificare che lo schema `APP_URL` sia `https://` |
| `BETTER_AUTH_SECRET is required` | `.env` non caricato | Usare `--env-file .env` in compose |
| `APP_URL must use HTTPS in production` | `APP_URL` non HTTPS per un dominio reale | Usare `https://your-domain`; `http://localhost` consentito solo per smoke/CI |
| `BETTER_AUTH_SECRET must be at least 32 characters` | Segreto troppo corto | Rigenerare con `openssl rand -base64 32` |

## Docker / NPM

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| NPM 502 Bad Gateway | App non sulla rete NPM | Impostare `NPM_NETWORK`; verificare che `ufw-app` si unisca alla rete esterna |
| Pagina setup facile da brute-force | Manca `TRUST_PROXY` | Impostare `TRUST_PROXY=1` dietro NPM |
| `ufw-app` unhealthy | DB down o segreti mancanti | Controllare `docker logs ufw-app`, salute postgres |
| `ufw-migrate` fallito | Errore migrazione | Leggere `docker logs ufw-migrate`; ripristinare backup se necessario |
| `pull access denied` | Pacchetto GHCR privato | Visibilità Public o `docker login ghcr.io` |

## SSH

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Test SSH fallito | Credenziali errate, firewall, host down | Verificare identità, porta; il server consente IP host Docker |
| Errore validazione host | IP privato bloccato | Impostare `SSH_ALLOWED_CIDRS` per reti interne |
| Chiave host cambiata | Reinstallazione server o MITM | Verificare fingerprint sul server; aggiornare dopo conferma |
| Chiave host non verificata | Importata da config | Eseguire test SSH dalla pagina modifica server |

## Regole / applicazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Pagina regole vuota / disabilitata | UFW non attivo | Installare e abilitare UFW dalla dashboard |
| Anteprima mostra eliminazioni inattese | Drift bozza | Risincronizzazione forzata dal server |
| Applicazione rifiutata — remoto cambiato | UFW cambiato tra anteprima e conferma | Eseguire di nuovo **Anteprima applicazione** (non resync) |
| Avviso applicazione parziale | Applicazione precedente interrotta o sync fallita | Risincronizzare; rivedere `ufw status` remoto manualmente |
| Banner operazione bloccato | RUNNING/PENDING obsoleto dopo disconnessione | Aggiornare la pagina |
| Escluso da SSH | Regola deny applicata | Accesso console/out-of-band; correggere UFW direttamente sul server |

## Dati

| Sintomo | Causa | Soluzione |
|---------|-------|-----------|
| Credenziali non valide dopo ripristino | `APP_ENCRYPTION_KEY` errato | Ripristinare `.env` corrispondente da backup |
| Impossibile decifrare identità | Rotazione chiave senza reimmissione | Reinserire segreti o ripristinare export JSON |

## API Health

```bash
docker exec ufw-app node -e "fetch('http://127.0.0.1:8088/api/health').then(r=>r.json()).then(console.log)"
```

Atteso: `{"status":"ok","db":"ok","version":"…"}` (`revision` solo fuori produzione)

## Ancora bloccato?

Inviare email a **[apps@finenumbers.com](mailto:apps@finenumbers.com)** con tag versione, log sanitizzati (senza segreti) e passi per riprodurre.
