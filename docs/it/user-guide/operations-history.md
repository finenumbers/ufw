# Cronologia operazioni

Le attività di lunga durata (applicazione, aggiornamento, installazione UFW, test SSH) sono tracciate nei **log operazioni** e mostrate nell'interfaccia.

## Banner operazioni

Mentre un'operazione è in corso, un banner appare in cima all'app:

- Tipo e stato operazione (RUNNING, SUCCESS, FAILED)
- Elenco passaggi espandibile con stato per passaggio
- Chiusura automatica al successo dopo un breve ritardo

Il banner effettua polling degli aggiornamenti mentre il lavoro è in corso.

## Pagina operazioni

Barra laterale → **Cronologia operazioni** (`/operations`)

Due schede:

| Scheda | Contenuto |
|-----|---------|
| **Operazioni** | Log operazioni tecnico — apply, sync, test SSH, ecc. |
| **Audit** | Eventi rilevanti per la sicurezza — login, logout, export configurazione |

Entrambe supportano scroll infinito per voci più vecchie.

## Tipi di operazione

Esempi:

- `apply_rules` — applicazione UFW
- `ufw_refresh` — aggiornamento stato e regole
- `ufw_sync` — sincronizzazione bozza con server
- `ufw_install` / `ufw_enable` — setup UFW
- `ssh_test` — verifica connessione
- `server_create` — nuovo server aggiunto

## Cancellare la cronologia

Gli amministratori possono cancellare la cronologia operazioni vecchia dall'interfaccia (gli eventi di audit possono essere conservati secondo la policy di retention). La cancellazione non influisce su stato server o regole.

## Documentazione correlata

- [Log di audit ed esportazione](../administration/audit-log-and-export.md)
- [Workflow bozza e applicazione](../concepts/draft-apply-workflow.md)
