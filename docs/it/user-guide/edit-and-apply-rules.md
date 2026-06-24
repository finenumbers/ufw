# Modificare e applicare regole

Quando UFW è **installato e attivo** su un server, apri la scheda **Regole** per gestire le regole firewall.

## Tabella regole

Funzionalità:

- Ricerca e filtri colonna
- Sezioni gruppo con espandi/comprimi
- Riordino drag-and-drop (l'ordine conta per UFW)
- Colori riga per [stato di sincronizzazione](../concepts/ufw-rules-and-states.md)
- Aggiungi riga, modifica inline, elimina riga

## Aggiornamento dal server

Clicca **Aggiorna stato** (o usa l'aggiornamento dalla dashboard) per:

1. Rilevare lo stato UFW
2. Caricare lo snapshot dal server
3. Sincronizzare gli stati di origine della bozza

Usalo dopo modifiche manuali sulla CLI del server o dopo un'applicazione parziale.

## Risincronizzazione forzata

Se l'interfaccia avvisa di deriva o applicazione parziale, usa **Risincronizzazione forzata dal server** per sostituire l'allineamento della bozza locale con lo snapshot remoto effettivo prima di modificare ulteriormente.

## Importare regole

Barra strumenti → importa CSV, XLSX o JSON. Valida le righe importate nella tabella prima dell'anteprima di applicazione.

## Workflow di applicazione

1. Apporta modifiche alla bozza
2. **Salva regole** — rivedi i comandi pianificati e il riepilogo diff
3. **Conferma** — esegue via SSH
4. Osserva il banner operazioni per il progresso

Vedi [Workflow bozza e applicazione](../concepts/draft-apply-workflow.md) per i dettagli.

## Consigli di sicurezza

- Mantieni sempre almeno una regola che consente SSH dalla tua rete admin prima di applicare regole deny
- Esegui l'anteprima in produzione durante una finestra di manutenzione
- Controlla la **Cronologia operazioni** dopo l'applicazione per stato SUCCESS o FAILED

## Documentazione correlata

- [Regole UFW e stati](../concepts/ufw-rules-and-states.md)
- [Cronologia operazioni](./operations-history.md)
