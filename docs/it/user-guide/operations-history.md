# Cronologia operazioni

I task di lunga durata — apply, sync, refresh, installazione UFW, scansione porte — sono tracciati nei **log operazioni** e mostrati nell'UI.

## Banner operazioni

Mentre il lavoro è in corso, un banner appare in cima:

| Elemento | Descrizione |
|---------|-------------|
| Stato | IN CORSO, IN ATTESA, SUCCESSO, ERRORE, PARZIALE |
| Passaggi | Stato per passaggio espandibile |
| Messaggio | Testo progresso o errore tradotto |

**SUCCESSO** si chiude automaticamente dopo ~10 secondi. **ERRORE** e **PARZIALE** restano fino alla chiusura.

### Comportamento polling (v0.9.2)

- Poll ~**1 secondo** mentre l'operazione è IN CORSO o IN ATTESA
- **Smette di fare polling quando idle** — nessun loop background a 5 secondi
- Riprende quando inizia una nuova operazione
- Al completamento, invia evento così le pagine server aggiornano i dati SSR

Vedi [Operazioni e concorrenza](../concepts/operations-and-concurrency.md).

### Banner bloccato

Se il banner mostra IN CORSO dopo disconnessione, aggiornate la pagina. Lo sweeper in background contrassegna operazioni RUNNING antiche come fallite entro ~30–60 minuti.

## Pagina operazioni

Barra laterale → **Cronologia operazioni** (`/operations`)

| Scheda | Contenuto |
|-----|---------|
| **Operazioni** | Log tecnico — apply, sync, refresh, scansione porte, errori creazione server |
| **Audit** | Eventi sicurezza — login, logout, export configurazione, azioni UFW |

Entrambe le schede supportano scroll infinito per voci più vecchie.

## Tipi operazione

Il database memorizza nomi con punti; l'UI li traduce.

| Tipo | Descrizione |
|------|-------------|
| `apply.rules` | Sessione apply UFW |
| `ufw.refresh` | Aggiorna stato — SSH live + sync regole |
| `ufw.sync` | Sync iniziale in background senza snapshot |
| `ufw.install` | Installazione e attivazione UFW remota |
| `port.scan` | Scansione porte esterna |
| `server.create` | Creazione server con errore SSH |

Legacy (solo voci storiche):

- `ssh_test` — pre v0.7.4; non più creato

## Cancellare la cronologia

**Cancella cronologia** rimuove vecchie voci log operazioni dall'UI/database per azione di retention. Non influisce su server, regole o UFW remoto.

La scheda Audit può conservare eventi secondo policy — vedi [Log di audit ed esportazione](../administration/audit-log-and-export.md).

## Documenti correlati

- [Operazioni e concorrenza](../concepts/operations-and-concurrency.md)
- [Workflow bozza e applicazione](../concepts/draft-apply-workflow.md)
- [Scansione porte](./port-scan.md)
