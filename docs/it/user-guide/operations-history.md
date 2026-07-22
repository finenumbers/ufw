# Cronologia operazioni

Le attività di lunga durata (applicazione, aggiornamento, installazione UFW, port scan) sono tracciate nei **log operazioni** e mostrate nell'interfaccia.

## Banner operazione

Mentre un'operazione è in corso, appare un banner in cima all'app:

- Tipo operazione e stato (RUNNING, SUCCESS, FAILED)
- Elenco passi espandibile con stato per passo
- Chiusura automatica in caso di successo dopo un breve ritardo

Il banner effettua polling degli aggiornamenti durante l'esecuzione.

Se un banner resta bloccato su **RUNNING** o **PENDING** dopo una disconnessione del browser, aggiornare la pagina. Le operazioni obsolete vengono eliminate automaticamente da una pulizia in background (tipicamente entro 30–60 minuti).

## Pagina operazioni

Barra laterale → **Cronologia operazioni** (`/operations`)

Due schede:

| Scheda | Contenuto |
|--------|-----------|
| **Operazioni** | Log tecnico operazioni — applicazione, sync, aggiornamento, port scan, ecc. |
| **Audit** | Eventi rilevanti per la sicurezza — login, logout, export configurazione |

Entrambe supportano lo scroll infinito per voci più vecchie.

## Tipi di operazione

Il database memorizza nomi di tipo con punti (ad esempio `ufw.refresh`). L'interfaccia li traduce con chiavi con underscore (ad esempio `ufw_refresh`).

Esempi attivi:

- `apply_rules` / `apply.rules` — applicazione UFW
- `ufw_refresh` / `ufw.refresh` — Aggiorna stato (lettura SSH live + sync regole)
- `ufw_sync` / `ufw.sync` — sync iniziale in background quando non esiste uno snapshot
- `ufw_install` / `ufw.install` — installazione UFW (l'abilitazione avviene durante l'installazione)
- `port_scan` / `port.scan` — port scan esterno
- `server_create` / `server.create` — nuovo server aggiunto

Legacy (solo voci storiche nel log):

- `ssh_test` — dalle versioni precedenti a v0.7.4; non viene più creato

## Cancellare la cronologia

Gli amministratori possono cancellare la cronologia operazioni vecchia dall'interfaccia (gli eventi audit possono essere conservati secondo la policy di retention). La cancellazione non influisce su stato del server o regole.

## Documentazione correlata

- [Log audit ed export](../administration/audit-log-and-export.md)
- [Flusso bozza e applicazione](../concepts/draft-apply-workflow.md)
