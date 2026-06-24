# Gestire i server

Questa guida illustra il ciclo di vita del server: aggiunta, configurazione UFW, aggiornamento, modifica ed eliminazione.

## Prerequisiti

Crea almeno un'[identità SSH](../concepts/ssh-identities.md) prima di aggiungere un server.

## Aggiungere un server

1. Barra laterale → **Server** o clicca **Aggiungi server**
2. Compila nome, host, porta e seleziona un'identità
3. Clicca **Crea server** — il test SSH viene eseguito automaticamente
4. In caso di successo, arrivi alla dashboard del server

Se il test SSH fallisce, controlla raggiungibilità host, credenziali, firewall che consente SSH dall'host Docker e [validazione host](../concepts/servers-and-ssh.md).

## Dashboard del server

La dashboard mostra lo stato UFW:

| Stato | Azioni disponibili |
|--------|-------------------|
| UFW non installato | **Installa UFW** |
| Installato ma inattivo | Attivazione UFW |
| Installato e attivo | **Regole**, aggiornamento stato, test SSH |

Usa **Aggiorna stato** per recuperare l'ultimo stato UFW e sincronizzare la tabella regole.

## Modificare un server

1. Apri server → **Modifica**
2. Cambia nome, host, porta o identità
3. Test SSH obbligatorio prima del salvataggio se i parametri di connessione sono cambiati

## Eliminare un server

**Zona pericolosa** nella pagina modifica o impostazioni server:

- Elimina tutte le regole locali, bozze, snapshot per questo server
- **Non** modifica UFW remoto

Conferma solo se intendi rimuovere i dati di gestione, non per cancellare le regole firewall remote.

## Strumenti elenco server

Dalla pagina principale server puoi:

- **Salva configurazione** / **Carica configurazione** — export/import JSON completo (vedi [Importazione ed esportazione configurazione](../concepts/import-export-config.md))

## Documentazione correlata

- [Server e SSH](../concepts/servers-and-ssh.md)
- [Modificare e applicare regole](./edit-and-apply-rules.md)
