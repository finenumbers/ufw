# FAQ

## Generale

**Cos'è UFW Remote Manager?**  
Un'interfaccia web self-hosted per gestire firewall UFW su server Linux remoti via SSH, con workflow bozza/applicazione e log di audit.

**È gratuito?**  
Open source con licenza MIT. Fornisci l'infrastruttura (host Docker, dominio, SSL).

**Chi lo ha sviluppato?**  
[Finenumbers](https://finenumbers.com) — vedi [Informazioni](./about.md).

## Account

**Posso creare più utenti amministratore?**  
Non tramite auto-registrazione. Viene creato un solo account su `/setup`; le registrazioni successive sono disabilitate.

**Ho dimenticato la password.**  
Il reset richiede accesso al database o ripristino da backup. Non c'è reset via email nella configurazione predefinita.

## Deployment

**Serve un'immagine Docker per ogni dominio?**  
No. Imposta `APP_URL` in `.env` a runtime. Un'immagine GHCR funziona per qualsiasi dominio HTTPS.

**Include Nginx Proxy Manager?**  
No. NPM (o un altro reverse proxy) va installato separatamente.

**Posso eseguirlo senza HTTPS?**  
Lo sviluppo locale usa `http://localhost:8088`. La produzione prevede HTTPS per cookie sicuri e HSTS.

## Operazioni firewall

**Eliminare un server rimuove le regole UFW remote?**  
No. Vengono eliminati solo i record nel database locale.

**Cosa succede se l'applicazione fallisce a metà?**  
UFW remoto può essere parzialmente aggiornato. Usa **Risincronizzazione forzata dal server** e consulta la Cronologia operazioni. Vedi [Workflow bozza e applicazione](./concepts/draft-apply-workflow.md).

**Posso gestire server su IP privati?**  
Sì, imposta `SSH_ALLOWED_CIDRS` in `.env` per consentire i tuoi range interni.

## Dati e sicurezza

**Dove sono archiviate le chiavi SSH?**  
Crittografate in Postgres con `APP_ENCRYPTION_KEY`. La chiave in `.env` è obbligatoria per la decrittografia.

**L'esportazione della configurazione è sicura?**  
L'export contiene **segreti in testo chiaro**. È richiesta la reinserimento della password; conserva gli export in modo sicuro.

## Supporto

Contatta **[apps@finenumbers.com](mailto:apps@finenumbers.com)** per domande sul prodotto.

Vulnerabilità di sicurezza: vedi [SECURITY.md](../../SECURITY.md) — non aprire issue pubbliche su GitHub.
