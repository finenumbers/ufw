# Modello di sicurezza

Questa pagina spiega come UFW Remote Manager protegge credenziali, sessioni e confini di rete.

Per segnalare vulnerabilità, vedi [SECURITY.md](../../../SECURITY.md) (inglese, versione canonica).

## Autenticazione

- **Better Auth** con email/password
- Account amministratore singolo dopo la configurazione iniziale — nessuna registrazione pubblica
- Cookie di sessione; `BETTER_AUTH_SECRET` obbligatorio in produzione
- Limitazione frequenza sugli endpoint auth (in memoria, replica singola)

## Crittografia credenziali

Password SSH e chiavi private sono crittografate con **AES-256-GCM** prima dell'archiviazione.

| Segreto | Scopo |
|--------|---------|
| `APP_ENCRYPTION_KEY` | Crittografa/decrittografa segreti identità (32 byte, base64) |
| `BETTER_AUTH_SECRET` | Firma token di sessione |

**Se `APP_ENCRYPTION_KEY` viene persa, le credenziali SSH crittografate non possono essere recuperate** — solo reinserite manualmente o ripristinate da backup export configurazione.

## Sicurezza SSH

- Validazione host blocca SSRF verso indirizzi privati/metadati al momento del salvataggio
- **Controllo risoluzione DNS:** prima di ogni connessione SSH e port scan, l'IP risolto viene validato di nuovo — blocca DNS rebinding verso indirizzi privati/metadati anche quando l'hostname sembrava sicuro al salvataggio
- `SSH_ALLOWED_CIDRS` opzionale per reti interne
- Pinning chiave host al primo collegamento riuscito
- Chiavi importate contrassegnate non verificate finché il test SSH non riesce
- Iniezione comandi prevenuta tramite enum in allowlist e costruzione comandi UFW sanitizzata

## Scansione porte esterna (opzionale)

Quando `PORT_SCAN_ENABLED=true`:

- Le scansioni vengono eseguite **solo** verso record `Server.host` già presenti nel database
- I hostname vengono risolti in IPv4 e validati con le stesse regole di SSH (**nessuna scansione senza IP validato**)
- Naabu + Nmap vengono eseguiti dentro `ufw-app` (connect scan, nessun target arbitrario)
- Limitazione frequenza per server; eventi di audit registrati
- Richiede **egress di rete** dal container app verso gli host gestiti sulle porte scansionate — vedi [Scansione porte](../deployment/port-scan.md)

## Monitoraggio Docker (opzionale)

Quando `DOCKER_MONITOR_ENABLED=true`:

- Inventario e controllo avvengono via **SSH** solo sui server registrati
- Riferimenti container validati; solo azioni `START` / `STOP` / `RESTART`
- Limiti di frequenza ed eventi di audit su refresh e controllo
- L'utente SSH necessita accesso alla CLI Docker — vedi [Monitoraggio Docker](../deployment/docker-monitor.md)

## Salvaguardie applicazione ed export

- Le modifiche UFW richiedono **anteprima + conferma esplicita**
- L'export configurazione richiede **reinserimento password** e scrive evento audit `CONFIG_EXPORT`
- I file di export contengono **segreti in testo chiaro** — responsabilità dell'operatore

## Header di sicurezza HTTP (produzione)

Quando `NODE_ENV=production`:

- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy

TLS termina su Nginx Proxy Manager; l'app riceve HTTP sulla rete Docker.

### Nota sulla Content-Security-Policy

La CSP attuale include `'unsafe-inline'` e `'unsafe-eval'` per script Next.js App Router e hydration. CSP basata su nonce è rinviata finché Next.js non la supporta senza rompere i bundle client. Non rimuovere queste direttive senza una regressione completa.

## Endpoint pubblici

| Percorso | Auth | Note |
|------|------|-------|
| `/api/health` | Nessuna | Restituisce `status`, `db`, `version`; `revision` (git/build id) solo in non-produzione |
| `/setup` | Nessuna (una volta) | Limitato per frequenza; usa `TRUST_PROXY=1` dietro NPM |

## Limitazione frequenza setup

La registrazione admin iniziale (`/setup`) è limitata a **5 tentativi al minuto** per IP client quando `TRUST_PROXY=1`, altrimenti per bucket connessione diretta.

## Checklist esposizione di rete

- [ ] Interfaccia admin solo via reverse proxy HTTPS
- [ ] Postgres non esposto a host/internet in produzione
- [ ] Limita URL admin (VPN, allowlist IP in NPM)
- [ ] Segreti `.env` robusti e univoci
- [ ] Backup regolari Postgres + `.env` off-host
- [ ] Ruota segreti se export o `.env` potrebbero essere trapelati

## Sanitizzazione errori

Gli errori lato client da percorsi SSH/applicazione sono sanitizzati per evitare fughe di stack trace o percorsi interni.

Le sessioni scadute restituiscono un messaggio coerente dalle server actions: `Session expired. Please sign in again.` (nessun `Unauthorized` grezzo propagato all'interfaccia).

## Documentazione correlata

- [Variabili d'ambiente](./environment-variables.md)
- [Log di audit ed esportazione](./audit-log-and-export.md)
- [Architettura](../architecture.md)
