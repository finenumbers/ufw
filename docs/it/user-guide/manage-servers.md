# Gestire i server

Questa guida illustra il ciclo di vita del server: aggiunta, configurazione UFW, aggiornamento, modifica ed eliminazione.

## Prerequisiti

Creare almeno un'[identità SSH](../concepts/ssh-identities.md) prima di aggiungere un server.

## Aggiungere un server

1. Barra laterale → **Server** o fare clic su **Aggiungi server**
2. Compilare nome, host, porta e selezionare un'identità
3. Fare clic su **Crea server** — il test SSH viene eseguito automaticamente
4. In caso di successo, si arriva alla dashboard del server

Se il test SSH fallisce, verificare raggiungibilità dell'host, credenziali, firewall che consenta SSH dall'host Docker e [validazione host](../concepts/servers-and-ssh.md).

## Dashboard del server

La dashboard carica lo **stato UFW in cache** dall'ultimo snapshot Postgres — nessun SSH al primo rendering. La pagina resta veloce.

| Stato | Azioni disponibili |
|-------|-------------------|
| UFW non installato | **Installa UFW** |
| Installato ma inattivo | **Abilita UFW** |
| Installato e attivo | **Regole**, aggiorna, test SSH |

Usare **Aggiorna** per recuperare l'ultimo stato UFW via SSH e sincronizzare la tabella delle regole.

Se UFW è attivo ma l'app **non ha ancora uno snapshot** (prima visita dopo l'abilitazione), viene eseguita una sincronizzazione automatica in background una volta per popolare la cache.

## Modificare un server

1. Aprire il server → **Modifica**
2. Cambiare nome, host, porta o identità
3. Test SSH richiesto prima del salvataggio se i parametri di connessione sono cambiati

## Eliminare un server

**Zona pericolosa** nella pagina di modifica o nelle impostazioni del server:

- Elimina tutte le regole locali, bozze e snapshot per questo server
- **Non modifica** l'UFW remoto

Confermare solo se si intende rimuovere i dati di gestione, non per cancellare le regole firewall remote.

## Strumenti elenco server

Dalla pagina principale dei server è possibile:

- **Salva configurazione** / **Carica configurazione** — export/import JSON completo (vedere [Import ed export configurazione](../concepts/import-export-config.md))

## Documentazione correlata

- [Server e SSH](../concepts/servers-and-ssh.md)
- [Modificare e applicare regole](./edit-and-apply-rules.md)
