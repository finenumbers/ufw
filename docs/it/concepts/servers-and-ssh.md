# Server e SSH

Un record **server** memorizza nome visualizzato, host, porta, identità SSH e impronta chiave host opzionale. Tutto il lavoro UFW remoto passa attraverso questo record.

## Validazione host

Prima del salvataggio, l'app valida l'host target:

| Controllo | Comportamento predefinito |
|-------|-------------------|
| Intervalli IP privati | **Rifiutati** (RFC1918, loopback, link-local) |
| IP metadata cloud | **Rifiutati** |
| Hostname / IP pubblici | Consentiti |
| Allowlist personalizzata | Impostate `SSH_ALLOWED_CIDRS` per intervalli privati specifici (lab/VPN) |

La risoluzione DNS è validata dove applicabile così gli errori di battitura falliscono presto.

## Verifica connessione

**Crea server** e **Modifica server** (quando host, porta o identità cambiano) eseguono automaticamente un test di connessione SSH. Non esiste un pulsante separato *Test connessione* nel modulo di modifica.

I messaggi di errore indicano raggiungibilità, credenziali, firewall o validazione host — vedi [Risoluzione problemi](../troubleshooting.md).

## Chiavi host SSH (trust on first use)

Al primo collegamento riuscito, l'impronta della chiave host del server viene memorizzata e contrassegnata come **verificata**.

| Stato | UI | Applicazione regole |
|-------|-----|-------------|
| **Verificata** | Impronta mostrata nella pagina modifica | Consentita dopo aggiornamento |
| **Non verificata** | Avviso su dashboard e pagina modifica | **Salva regole** (apply) bloccato finché **Aggiorna stato** non riesce |

Riduce il rischio MITM al primo collegamento. Per fidarsi di una nuova chiave dopo ricostruzione server, aggiornate il server o cancellate e riverificate via aggiornamento.

I server importati dalla configurazione possono arrivare con impronte memorizzate — verificate con **Aggiorna stato** prima di applicare regole.

## Sudo e UFW

I comandi remoti assumono che l'utente SSH possa eseguire `ufw` — tipicamente via sudo senza password per `ufw` o root. L'app avvolge i comandi apt install in `sudo` dove necessario per **Installa UFW**.

Assicuratevi che `/etc/sudoers` consenta i comandi richiesti per l'utente scelto.

## Server duplicati

La stessa combinazione host + porta + identità non può essere registrata due volte. Usate nomi distinti se gestite intenzionalmente lo stesso host con account diversi (identità diverse).

## Documenti correlati

- [Identità SSH](./ssh-identities.md)
- [Gestire i server](../user-guide/manage-servers.md)
- [Variabili d'ambiente](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
