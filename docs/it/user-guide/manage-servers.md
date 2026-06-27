# Gestire i server

Questa guida illustra il ciclo di vita del server: aggiunta, configurazione UFW, aggiornamento, modifica ed eliminazione.

## Prerequisiti

Creare almeno un'[identità SSH](../concepts/ssh-identities.md) prima di aggiungere un server.

## Aggiungere un server

1. Barra laterale → **Server** o fare clic su **Aggiungi server**
2. Compilare nome, host, porta e selezionare un'identità
3. Fare clic su **Crea server** — la connessione SSH viene verificata automaticamente all'invio
4. In caso di successo, si arriva alla dashboard del server

Se la verifica fallisce, controllare raggiungibilità dell'host, credenziali, firewall che consenta SSH dall'host Docker e [validazione host](../concepts/servers-and-ssh.md).

## Dashboard del server

La dashboard carica lo **stato UFW in cache** dall'ultimo snapshot Postgres — nessun SSH al primo rendering. I pannelli port scan e Docker caricano anche gli ultimi risultati in cache da Postgres, se disponibili.

| Stato | Azioni disponibili |
|-------|-------------------|
| UFW non installato | **Aggiorna stato**, poi **Installa UFW** (dopo un aggiornamento che conferma l'assenza di UFW) |
| Installato ma inattivo | Solo **Aggiorna stato** — UFW è già installato; usare l'aggiornamento per rilevare lo stato attivo/inattivo |
| Installato e attivo | **Aggiungi regola**, **Salva regole**, **Aggiorna stato** |

Fare clic prima su **Aggiorna stato** per verificare SSH e rilevare se UFW è installato. **Installa UFW** resta disabilitato finché un aggiornamento riuscito non indica l'assenza di UFW.

Finché non si esegue **Aggiorna stato**, il badge UFW può mostrare un'etichetta attivo/inattivo **in cache** dall'ultimo snapshot.

Usare **Aggiorna stato** per recuperare l'ultimo stato UFW via SSH e sincronizzare la tabella delle regole. Se sono presenti **modifiche non salvate** alle regole, l'app chiede conferma prima di ricaricare dal server.

Se l'app **non ha ancora uno snapshot UFW** in Postgres (server nuovo, mai aggiornato, ecc.), viene eseguita una volta una sincronizzazione automatica in background per popolare la cache.

## Conteggio regole

Nell'interfaccia compaiono due contatori distinti:

| Posizione | Etichetta | Significato |
|-----------|-----------|-------------|
| Scheda nell'**elenco server** | regole salvate | Numero di regole memorizzate nei metadati locali (`ruleRecord`) |
| Badge **dashboard** sotto Aggiungi regola | in tabella | Numero di righe nella tabella regole (sessione bozza attiva) |

Questi numeri possono differire durante modifica, sincronizzazione o importazione. Il badge della dashboard corrisponde al totale della tabella regole.

## Modificare un server

1. Aprire il server → **Modifica**
2. Cambiare nome, host, porta o identità
3. La connessione SSH viene verificata automaticamente all'invio se i parametri di connessione sono cambiati

La pagina di modifica mostra l'impronta della chiave host memorizzata e un avviso **non verificata** se applicabile — non c'è un pulsante di test separato.

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
