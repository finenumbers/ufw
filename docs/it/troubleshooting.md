# Risoluzione problemi

Sintomo → causa probabile → soluzione. Per i concetti vedere i documenti collegati.

## Autenticazione e configurazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| `/setup` reindirizza al login | Utente già esistente | Usate `/login` |
| Login fallisce dopo deploy | `APP_URL` errato o HTTP invece di HTTPS | Allineate al dominio NPM; impostate `APP_URL=https://...` |
| Limite frequenza setup troppo aggressivo | `TRUST_PROXY` mancante dietro NPM | Impostate `TRUST_PROXY=1` |

## SSH e creazione server

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| IP privato rifiutato | Validazione host | Usate IP/hostname pubblico o `SSH_ALLOWED_CIDRS` |
| Connessione rifiutata | Firewall, porta errata, host down | Verificate dall'host Docker: `ssh -p PORT user@host` |
| Autenticazione fallita | Credenziali identità errate | Modificate l'identità; reinserite il segreto |
| Avviso chiave host | Primo collegamento o server ricostruito | **Aggiorna stato** per acquisire la nuova impronta |

## UFW e regole

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Applicazione disabilitata | Chiave host non verificata | **Aggiorna stato** |
| Applicazione rifiutata dopo anteprima | UFW remoto cambiato | **Anteprima applicazione** di nuovo |
| Applicazione parziale | Comandi interrotti o sync fallita | **Risincronizzazione forzata dal server**; controllate cronologia operazioni |
| Anteprima mostra eliminazioni inattese | Deriva bozza | **Risincronizzazione forzata dal server** |
| Regole riappaiono dopo eliminazione sul server | Sync obsoleta (pre-v0.9.2) | Aggiornate a v0.9.2+; risincronizzazione forzata |
| Bloccato fuori da SSH | Regola deny applicata | Accesso console; correggete UFW out-of-band |

## Banner operazioni

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Banner IN CORSO per sempre | Browser disconnesso a metà operazione | Aggiornate la pagina; attendete lo sweeper |
| Tabella obsoleta dopo sync | Fine operazione non rilevata (raro post-v0.9.2) | Refresh del browser |
| Traffico API in idle | Versione vecchia con polling infinito | Aggiornate a v0.9.2 — il polling idle si ferma |

## Scansione porte

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Pannello assente | Funzionalità disabilitata | `PORT_SCAN_ENABLED=true` |
| Scansione fallita timeout | Intervallo porte ampio / rete lenta | Aumentate `PORT_SCAN_*_TIMEOUT_MS`; controllate egress |
| Errore scansione in corso | Guardia sovrapposizione | Attendete la scansione corrente |
| Nessun risultato | Tutte le porte filtrate/chiuse | Previsto; controllate stato SUCCESS della scansione |
| Progresso perso al refresh (vecchio) | SSR caricava solo scansioni SUCCESS | Aggiornate a v0.9.2 |

## Docker e migrate

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| `EACCES` prisma in app | Container errato | `docker compose run --rm migrate` |
| Migrate fallisce all'aggiornamento | Permessi DB o versione vecchia | Controllate `docker compose logs migrate` |
| App unhealthy | Segreti errati o DB down | Log: `docker compose logs app` |

## Import/export configurazione

| Sintomo | Causa | Soluzione |
|---------|-------|-----|
| Import bloccato | Operazioni attive sul server | Attendete coda idle |
| Export limitato | Troppi tentativi | Attendete 60 secondi |
| Segreti decifrati corrotti dopo ripristino | `APP_ENCRYPTION_KEY` errata | Ripristinate `.env` corrispondente |

## Documenti correlati

- [FAQ](./faq.md)
- [Operazioni e concorrenza](./concepts/operations-and-concurrency.md)
- [Variabili d'ambiente](./administration/environment-variables.md)
