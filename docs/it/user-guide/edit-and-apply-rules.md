# Modificare e applicare regole

Quando UFW è **installato e attivo** su un server, la **tabella regole** nella dashboard del server consente di gestire le regole firewall.

## Tabella regole

Funzionalità:

- Ricerca e filtri per colonna
- Sezioni di gruppi con espandi/comprimi
- Riordino drag-and-drop (l'ordine conta per UFW)
- Colori riga per [stato di sincronizzazione](../concepts/ufw-rules-and-states.md)
- Aggiungi riga, modifica inline, elimina riga

## Aggiornamento dal server

Usare **Aggiorna stato** nella dashboard (o l'aggiornamento dalla barra strumenti regole) per:

1. Rilevare lo stato UFW via SSH
2. Caricare un nuovo snapshot dal server
3. Reinizializzare la tabella regole da remoto + metadati locali

Se sono presenti **modifiche non salvate**, l'app mostra una finestra di conferma prima di ricaricare dal server.

Usare dopo modifiche manuali sulla CLI del server o dopo un'applicazione parziale.

## Risincronizzazione forzata

Se l'interfaccia segnala drift o applicazione parziale, usare **Risincronizzazione forzata dal server** per sostituire l'allineamento locale della bozza con lo snapshot remoto effettivo prima di continuare a modificare.

## Importare regole

Barra strumenti → importa CSV, XLSX o JSON. Validare le righe importate nella tabella prima dell'anteprima di applicazione.

## Flusso di applicazione

1. Effettuare modifiche alla bozza
2. **Anteprima applicazione** — rivedere comandi pianificati e riepilogo diff
3. **Conferma** — esecuzione via SSH (rifiutata se l'UFW remoto è cambiato dall'anteprima — eseguire di nuovo l'anteprima)
4. Seguire il banner operazione per il progresso

**Salva regole** (anteprima applicazione) resta disabilitato finché la chiave host SSH non è **verificata** — eseguire **Aggiorna stato** prima se il server è stato importato dalla configurazione.

Vedere [Flusso bozza e applicazione](../concepts/draft-apply-workflow.md) per i dettagli.

## Consigli di sicurezza

- Mantenere almeno una regola che consenta SSH dalla rete di amministrazione prima di applicare regole deny
- Eseguire l'anteprima in produzione durante una finestra di manutenzione
- Controllare la **Cronologia operazioni** dopo l'applicazione per lo stato SUCCESS o FAILED

## Documentazione correlata

- [Regole UFW e stati](../concepts/ufw-rules-and-states.md)
- [Cronologia operazioni](./operations-history.md)
