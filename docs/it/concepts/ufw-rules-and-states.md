# Regole UFW e stati

Le regole sono normalizzate in un modello di riga unificato con campi **core** (ciò che interessa a UFW) e campi **UI** (nome, gruppo, metadati colore).

## Campi core delle regole

Le colonne tipiche includono azione (allow/deny/reject), direzione, protocollo, porte, indirizzi sorgente/destinazione e modalità di logging. L'insieme esatto corrisponde alla sintassi espressiva delle regole UFW — vedi la tabella regole nell'interfaccia.

## Stati di sincronizzazione (colori riga)

Ogni riga ha uno **stato** che mostra come i dati della bozza locale si rapportano all'ultimo snapshot del server:

| Stato | Significato |
|-------|---------|
| **MATCHED** | La bozza corrisponde a quanto UFW ha riportato sul server |
| **REMOTE_ONLY** | Presente nello snapshot del server ma non nella bozza locale |
| **LOCAL_ONLY** | Nella bozza ma non sul server (verrà aggiunta all'applicazione) |
| **DRAFT_ONLY** | Modifica locale non ancora applicata; differisce dalla baseline MATCHED |

I colori aiutano a individuare la deriva prima dell'applicazione. Dopo **Risincronizzazione forzata dal server**, la bozza locale si riallinea allo stato remoto.

## Impronte digitali

Ogni regola ha un'impronta derivata dai campi core. Usata per abbinare le righe tra snapshot e rilevare operazioni di riordino/eliminazione durante la pianificazione dell'applicazione.

## Raggruppamento e ordine

- **Gruppi** — organizzano le regole visivamente; il nome del gruppo è metadato UI
- **Ordine** — l'ordine delle regole UFW conta; il riordino può richiedere eliminazione e ricreazione sul server durante l'applicazione

## Formati di importazione

Le regole possono essere importate da **CSV**, **XLSX** o **JSON** dalla barra strumenti regole. Le righe importate diventano voci di bozza — richiedono comunque l'applicazione per raggiungere il server.

## Documentazione correlata

- [Workflow bozza e applicazione](./draft-apply-workflow.md)
- [Modificare e applicare regole](../user-guide/edit-and-apply-rules.md)
