# Importazione ed esportazione configurazione

Esportate e importate un file **JSON v2** contenente tutti i server, le identità SSH (inclusi segreti decifrati) e i metadati correlati. Usate per backup, migrazione o disaster recovery — non per la modifica quotidiana delle regole.

L'import/export a livello regola (CSV, XLSX) è separato — vedi [Modificare e applicare regole](../user-guide/edit-and-apply-rules.md).

## Flusso export

1. Elenco **Server** → **Salva configurazione**
2. Inserite la **password** del vostro account (autenticazione step-up)
3. Scaricate il file JSON (`servers-config-YYYY-MM-DD.json`)

L'export include segreti SSH decifrati. Conservate il file crittografato a riposo; eliminate quando non più necessario.

Un token a breve durata protegge la route API di download dopo conferma password.

Limite di frequenza: 5 export al minuto per utente.

## Flusso import

1. **Carica configurazione** → selezionate file JSON
2. L'**anteprima** mostra il diff: server e identità da creare, aggiornare o eliminare
3. Confermate con password → l'import applica le modifiche

L'import attende che le code per server siano idle e blocca se operazioni distruttive confliggono con lavoro attivo.

## Formato JSON v2

| Sezione | Contenuto |
|---------|----------|
| **version** | `2` |
| **identities** | Nome, username, metodo auth, segreti |
| **servers** | Nome, host, porta, riferimento identità, campi chiave host |

File legacy solo array o v1 vengono rifiutati.

Chiavi duplicate (stesso host + porta + identità) vengono rifiutate al parse.

## Semantica eliminazione all'import

I server presenti nel database ma assenti dal file importato compaiono nel set **elimina** dell'anteprima. Confermate solo se intendete rimuovere quei record server e tutte le regole, bozze e snapshot associati localmente.

UFW remoto sui record server eliminati **non** viene modificato.

## Documenti correlati

- [Identità SSH](./ssh-identities.md)
- [Backup e ripristino](../operations/backup-restore.md)
- [Log di audit ed esportazione](../administration/audit-log-and-export.md)
