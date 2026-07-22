# Log di audit ed esportazione

Due tracce complementari: **log operazioni** (progresso task) ed **eventi di audit** (sicurezza e compliance).

## Eventi di audit

Scritti in Postgres su azioni sensibili. Esempi:

| Azione | Quando |
|--------|------|
| `LOGIN` / `LOGOUT` | Inizio/fine sessione |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Workflow apply |
| `SNAPSHOT_LOADED` | Snapshot UFW acquisito |
| `UFW_ENABLE` | Attivazione remota dopo install |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Ciclo di vita scansione porte |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | Trasferimento configurazione JSON v2 |
| CRUD server | Creazione/aggiornamento/eliminazione record server |

Visualizzate su **Cronologia operazioni** → scheda **Audit** con scroll infinito.

La retention audit segue l'archiviazione database — nessuna purge automatica salvo cancellazione cronologia da operatore.

## Log operazioni

Record tecnici con passaggi, stato, timestamp e messaggi di errore. Vedi [Cronologia operazioni](../user-guide/operations-history.md).

## Audit export configurazione

Ogni **Salva configurazione** riuscita crea una voce audit. Il file export contiene **segreti SSH decifrati** — proteggetelo come un dump password vault.

Flusso export:

1. Conferma password (step-up)
2. Token download a breve durata
3. Download JSON via route API

Limite di frequenza: 5 export al minuto per utente.

## Cancellare la cronologia

**Cancella cronologia** sulla pagina operazioni rimuove voci log operazioni per azione UI. Non annulla modifiche server né elimina eventi audit in tutti i casi — confermate il testo della finestra di dialogo per il comportamento attuale.

Non modifica UFW remoto o bozze regola locali.

## Documenti correlati

- [Importazione ed esportazione configurazione](../concepts/import-export-config.md)
- [Modello di sicurezza](./security-model.md)
