# Cronologia operazioni

Le attività di lunga durata (applicazione, aggiornamento, installazione UFW, test SSH) sono tracciate nei **log operazioni** e mostrate nell'interfaccia.

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
| **Operazioni** | Log tecnico operazioni — applicazione, sync, test SSH, ecc. |
| **Audit** | Eventi rilevanti per la sicurezza — login, logout, export configurazione |

Entrambe supportano lo scroll infinito per voci più vecchie.

## Tipi di operazione

Esempi:

- `apply_rules` — applicazione UFW
- `ufw_refresh` — aggiornamento stato e regole
- `ufw_sync` — sincronizzazione bozza con server
- `ufw_install` / `ufw_enable` — configurazione UFW
- `ssh_test` — verifica connessione
- `server_create` — nuovo server aggiunto

## Cancellare la cronologia

Gli amministratori possono cancellare la cronologia operazioni vecchia dall'interfaccia (gli eventi audit possono essere conservati secondo la policy di retention). La cancellazione non influisce su stato del server o regole.

## Documentazione correlata

- [Log audit ed export](../administration/audit-log-and-export.md)
- [Flusso bozza e applicazione](../concepts/draft-apply-workflow.md)
