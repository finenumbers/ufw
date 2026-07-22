# Modificare e applicare regole

Con UFW **installato e attivo**, la **tabella regole** sulla dashboard server è la superficie di modifica principale.

## Funzionalità tabella regole

| Funzionalità | Descrizione |
|---------|-------------|
| **Ricerca** | Filtra righe visibili |
| **Filtri colonna** | Filtra per gruppo o nome |
| **Sezioni gruppo** | Espandi/comprimi righe raggruppate |
| **Drag-and-drop** | Riordina regole (l'ordine influisce su UFW) |
| **Colori riga** | Indicatori [stato origine](../concepts/ufw-rules-and-states.md) |
| **Modifica inline** | Doppio clic o azione modifica sulla riga |
| **Aggiungi / elimina** | Toolbar e azioni riga |
| **Carica altro** | Scroll infinito per set regole grandi |

## Aggiornare dal server

**Aggiorna stato** sulla dashboard (o sync dalla toolbar):

1. Rileva stato UFW via SSH
2. Memorizza nuovo snapshot
3. Re-seed tabella da remoto + metadati locali

Usate dopo modifiche CLI manuali sul server o dopo apply parziale.

Le modifiche bozza non salvate attivano una finestra di conferma prima del reload.

## Risincronizzazione forzata dal server

Quando l'UI avvisa di deriva o apply parziale, usate **Risincronizzazione forzata dal server** per allineare la bozza allo snapshot remoto effettivo prima di ulteriori modifiche.

Disponibile dalla finestra anteprima apply e avvisi correlati — non sostituisce la re-anteprima quando il remoto è cambiato tra anteprima e conferma.

## Importare regole

Toolbar → import **CSV**, **XLSX** o **JSON**:

- Le righe si uniscono alla bozza; duplicati per fingerprint saltati o uniti secondo regole import
- Validate le righe nella tabella prima dell'anteprima apply
- L'import influisce solo la bozza fino all'apply

## Esportare regole

Esportate la tabella corrente in **XLSX** per revisione offline o backup. Il layout XLSX corrisponde all'ordine colonne import per workflow round-trip.

## Workflow applicazione

1. Modificate la bozza
2. **Anteprima applicazione** — revisione comandi pianificati e conteggi riepilogo
3. **Conferma** — esegue via SSH (rifiutato se remoto cambiato dall'anteprima)
4. Osservate il **banner operazioni** per progresso per comando

**Salva regole** / apply è disabilitato finché la chiave host SSH non è **verificata** — eseguite prima **Aggiorna stato** per server importati.

Vedi [Workflow bozza e applicazione](../concepts/draft-apply-workflow.md).

## Consigli di sicurezza

- Mantenete almeno una regola che consente SSH dalla rete admin prima delle regole deny
- Eseguite l'anteprima in produzione durante una finestra di manutenzione
- Controllate **Cronologia operazioni** dopo l'apply per SUCCESSO o ERRORE

## Documenti correlati

- [Regole UFW e stati](../concepts/ufw-rules-and-states.md)
- [Cronologia operazioni](./operations-history.md)
