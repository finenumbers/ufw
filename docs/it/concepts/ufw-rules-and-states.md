# Regole UFW e stati

La tabella regole mostra una **vista unificata**: regole UFW remote, metadati locali e le vostre modifiche in bozza. I **colori** delle righe riflettono come ogni riga si relaziona al server e al database.

## Struttura regola

Ogni riga ha:

| Livello | Campi |
|-------|--------|
| **Core** | action, direction, protocol, addresses, ports, interface, app profile, log mode, comment, IPv6 |
| **Metadati UI** | group, name, notes (memorizzati localmente, non inviati a UFW salvo nel commento) |
| **Origine** | stato sync che guida il colore della riga |

Le fingerprint identificano le regole tra ricaricamenti remoti e modifiche locali.

## Stati di origine

| Stato | Significato colore | Situazione tipica |
|-------|---------------|-------------------|
| **MATCHED** | Remoto e metadati locali concordano | Regola sincronizzata stabile |
| **REMOTE_ONLY** | Sul server, non nei metadati locali | Nuova regola remota dopo aggiornamento |
| **LOCAL_ONLY** | Nel DB locale, non sul server | Aggiunta in sospeso o rimossa in remoto |
| **DRAFT_ONLY** | Modifica bozza non ancora applicata | Nuova riga o campi core modificati |
| **CONFLICT** | Stessa fingerprint, campi core diversi | Deriva — revisione prima dell'apply |
| **DELETED** | Contrassegnata eliminata in bozza | Sarà rimossa all'apply |

I colori aiutano a individuare la deriva **prima** dell'applicazione. Dopo **Risincronizzazione forzata dal server**, la bozza si riallinea allo snapshot remoto.

## Due conteggi regole

L'UI mostra conteggi diversi in punti diversi:

| Posizione | Etichetta | Conta |
|----------|-------|--------|
| Scheda **elenco server** | regole salvate | Righe in `ruleRecord` (metadati locali) |
| Badge **dashboard** | in tabella | Righe nella tabella della sessione bozza attiva |

Differiscono durante modifica, import o sync. Il badge dashboard corrisponde alla lunghezza della tabella visibile.

## L'ordine conta

UFW valuta le regole in ordine. La tabella supporta riordino drag-and-drop. L'apply può emettere operazioni di risincronizzazione ordine quando la numerazione remota diverge dall'ordine bozza.

## Metadati remoti vs locali

- I **campi core remoti** provengono dall'output analizzato di `ufw status numbered`
- **Gruppo, nome, note** esistono solo in UFW Remote Manager salvo copiati nei commenti regola UFW
- L'apply scrive i campi core sul server; i metadati UI restano in Postgres

## Documenti correlati

- [Workflow bozza e applicazione](./draft-apply-workflow.md)
- [Modificare e applicare regole](../user-guide/edit-and-apply-rules.md)
