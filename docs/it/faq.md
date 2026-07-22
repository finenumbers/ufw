# FAQ

## Generale

### Cos'è UFW Remote Manager?

Un'app web self-hosted per gestire firewall UFW su server Linux remoti via SSH, con workflow bozza/applicazione e traccia di audit.

### Sostituisce Nginx Proxy Manager?

No. NPM (o simile) termina HTTPS per l'UI admin. UFW Remote Manager gestisce i **firewall dei server remoti**, non il reverse proxy.

### Posso gestire container Docker?

No. Il monitoraggio container Docker è stato **rimosso in v0.9.0**. L'app gestisce solo regole UFW e scansioni porte esterne opzionali.

### Quanti utenti amministratori?

Un account dopo la configurazione iniziale `/setup`. Nessuna UI multi-utente.

### Posso eseguire più repliche app?

Sconsigliato. Limiti di frequenza e code sono in memoria (design a replica singola).

## SSH e server

### Perché un IP privato viene rifiutato?

Sicurezza predefinita — blocca indirizzi RFC1918 e metadata. Impostate `SSH_ALLOWED_CIDRS` per target lab/VPN.

### Perché l'applicazione è disabilitata?

La chiave host SSH potrebbe essere **non verificata**. Eseguite prima **Aggiorna stato** con successo.

### L'eliminazione del server modifica UFW remoto?

No. L'eliminazione rimuove solo i dati di gestione locali.

## Regole e applicazione

### Anteprima vs conferma?

L'anteprima mostra le modifiche pianificate senza eseguirle. La conferma esegue i comandi UFW via SSH.

### Remoto cambiato dall'anteprima?

Applicazione rifiutata — eseguite di nuovo **Anteprima applicazione**. Non usate la risincronizzazione forzata in questo caso.

### Applicazione parziale?

Vedi [Workflow bozza e applicazione](./concepts/draft-apply-workflow.md). Usate **Risincronizzazione forzata dal server** quando indicato.

### Perché i conteggi regole differiscono?

**Regole salvate** (scheda elenco) vs **in tabella** (dashboard) contano cose diverse — vedi [Regole UFW e stati](./concepts/ufw-rules-and-states.md).

## UI operazioni

### Banner bloccato su IN CORSO?

Aggiornate la pagina. Lo sweeper cancella operazioni obsolete entro ~30–60 minuti.

### Regole non aggiornate dopo sync?

Da v0.9.2, la fine operazione dovrebbe aggiornare la pagina. Provate un refresh manuale del browser una volta.

## Scansione porte

### Pulsante scan assente?

`PORT_SCAN_ENABLED` non impostato su `true` nell'ambiente app.

### Scansione già in corso?

Solo una scansione attiva per server. Attendete o controllate la cronologia operazioni.

### La scansione blocca l'aggiornamento UFW?

No (da v0.9.2). La scansione gira fuori dalla coda SSH.

## Deployment

### Dove eseguire le migrazioni?

Nel container **migrate** / **ufw-migrate** — non dentro **ufw-app**. Vedi [Panoramica deployment](./deployment/overview.md).

### EACCES eseguendo prisma nel container app?

Previsto — usate `docker compose run --rm migrate`.

## Documenti correlati

- [Risoluzione problemi](./troubleshooting.md)
- [Introduzione](./introduction.md)
