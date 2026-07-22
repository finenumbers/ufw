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

## Evidenziazione indirizzi sovrapposti

Regole diverse possono coprire lo stesso traffico anche con fingerprint diverse — ad esempio `95.163.183.223` dentro `95.163.183.192/26`, o un `/24` più ampio che copre un `/26` esistente.

Le righe coinvolte in almeno una coppia del genere sono evidenziate in **viola** nella tabella. Questo colore ha priorità su verde/giallo/rosso di origine. Sono evidenziate **entrambe** le righe della coppia.

La legenda sopra la tabella include un campione viola: **Intervalli IP o CIDR sovrapposti**.

La sovrapposizione è calcolata dal draft corrente (stessa direction, stessa famiglia IP, indirizzi non `anywhere`). È **solo un avviso** — import e apply non sono bloccati. Rimuovete o modificate indirizzi finché l'evidenziazione viola non scompare.

Tipico dopo import: un nuovo host o CIDR si sovrappone a una regola già sul server. Controllate l'ordine — UFW usa la prima regola corrispondente.

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
