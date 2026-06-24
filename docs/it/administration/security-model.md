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

- Validazione host blocca SSRF verso indirizzi privati/metadati
- `SSH_ALLOWED_CIDRS` opzionale per reti interne
- Pinning chiave host al primo collegamento riuscito
- Chiavi importate contrassegnate non verificate finché il test SSH non riesce
- Iniezione comandi prevenuta tramite enum in allowlist e costruzione comandi UFW sanitizzata

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

## Checklist esposizione di rete

- [ ] Interfaccia admin solo via reverse proxy HTTPS
- [ ] Postgres non esposto a host/internet in produzione
- [ ] Limita URL admin (VPN, allowlist IP in NPM)
- [ ] Segreti `.env` robusti e univoci
- [ ] Backup regolari Postgres + `.env` off-host
- [ ] Ruota segreti se export o `.env` potrebbero essere trapelati

## Sanitizzazione errori

Gli errori lato client da percorsi SSH/applicazione sono sanitizzati per evitare fughe di stack trace o percorsi interni.

## Documentazione correlata

- [Variabili d'ambiente](./environment-variables.md)
- [Log di audit ed esportazione](./audit-log-and-export.md)
- [Architettura](../architecture.md)
