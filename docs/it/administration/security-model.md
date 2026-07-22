# Modello di sicurezza

UFW Remote Manager è uno **strumento admin privilegiato**: memorizza segreti SSH, esegue comandi firewall remoti ed espone un'UI web. Le assunzioni di design e i controlli sono documentati qui.

## Threat model (riepilogo)

| Asset | Rischio | Mitigazione |
|-------|------|------------|
| Credenziali SSH | Divulgazione | AES-256-GCM a riposo; decifrati solo per connessioni |
| Cookie sessione | Hijack | HTTPS, cookie HTTP-only, `BETTER_AUTH_SECRET` |
| Impersonazione host | MITM su SSH | Impronta chiave host al primo collegamento; non verificata blocca apply |
| Admin non autorizzato | Brute force | Utente singolo; limite frequenza setup; password robuste |
| CSRF / XSS | Abuso account | Default framework, CSP in produzione |
| File export configurazione | Perdita segreti | Password step-up; responsabilità operatore |

L'app **non** implementa ACL per server — qualsiasi admin autenticato può gestire tutti i server.

## Autenticazione

- Sessioni email/password Better Auth
- Registrazione disabilitata dopo il primo utente (`/setup` una volta)
- Logout cancella sessione; login/logout auditati

Eseguite solo su **HTTPS** in produzione (`APP_URL` deve usare https eccetto localhost).

## Crittografia a riposo

| Segreto | Chiave |
|--------|-----|
| Password e chiavi identità | `APP_ENCRYPTION_KEY` (32 byte) |
| Firma sessione | `BETTER_AUTH_SECRET` (min 32 caratteri in prod) |

Ruotare `APP_ENCRYPTION_KEY` senza reimportare le identità rende il ciphertext memorizzato inutilizzabile.

## Esposizione di rete

Compose produzione (`docker-compose.prod.yml`):

- Postgres **non** pubblicato sull'host
- App in ascolto nella rete Docker per NPM
- SSH target dal container app ai server gestiti

TLS termina su **Nginx Proxy Manager**. HTTP interno tra NPM e `ufw-app` è intenzionale — vedi [Nginx Proxy Manager](../deployment/nginx-proxy-manager.md).

## Sicurezza SSH

- Blocco predefinito su IP target privati/metadata
- Opzionale `SSH_ALLOWED_CIDRS` per lab/VPN
- Host key TOFU — vedi [Server e SSH](../concepts/servers-and-ssh.md)
- Apply bloccato finché la chiave host non è verificata

## Hardening applicazione

Header HTTP produzione (CSP, HSTS, ecc.) via `next.config.ts`.

Endpoint health `/api/health` espone versione — nessun segreto.

## Audit

Le azioni sensibili scrivono righe `auditEvent`: login, logout, apply, snapshot, scansione porte, export configurazione, modifiche server. Vedi [Log di audit ed esportazione](./audit-log-and-export.md).

## Replica singola

Limiti di frequenza e code sono **in memoria**. Più repliche app senza stato condiviso indeboliscono limiti e garanzie coda.

## Segnalazione vulnerabilità

Vedi [SECURITY.md](../../../SECURITY.md) nella root del repository (inglese).

## Documenti correlati

- [Variabili d'ambiente](./environment-variables.md)
- [Architettura](../architecture.md)
