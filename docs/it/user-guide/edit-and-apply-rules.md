# Modificare e applicare regole

Quando UFW è **installato e attivo** su un server, aprire la scheda **Regole** per gestire le regole firewall.

## Tabella regole

Funzionalità:

- Ricerca e filtri per colonna
- Sezioni di gruppi con espandi/comprimi
- Riordino drag-and-drop (l'ordine conta per UFW)
- Colori riga per [stato di sincronizzazione](../concepts/ufw-rules-and-states.md)
- Aggiungi riga, modifica inline, elimina riga

## Aggiorna dal server

Fare clic su **Aggiorna** (o usare l'aggiornamento della dashboard) per:

1. Rilevare lo stato UFW
2. Caricare lo snapshot dal server
3. Sincronizzare gli stati di origine della bozza

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

Vedere [Flusso bozza e applicazione](../concepts/draft-apply-workflow.md) per i dettagli.

## Consigli di sicurezza

- Mantenere almeno una regola che consenta SSH dalla rete di amministrazione prima di applicare regole deny
- Eseguire l'anteprima in produzione durante una finestra di manutenzione
- Controllare la **Cronologia operazioni** dopo l'applicazione per lo stato SUCCESS o FAILED

## Documentazione correlata

- [Regole UFW e stati](../concepts/ufw-rules-and-states.md)
- [Cronologia operazioni](./operations-history.md)
