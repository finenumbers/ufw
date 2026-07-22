# Scansione porte (guida utente)

Se abilitata dal vostro amministratore, il **pannello scansione porte** su ogni pagina server scopre servizi TCP raggiungibili esternamente e li confronta con le regole UFW.

Gli amministratori abilitano e regolano la scansione via variabili d'ambiente — vedi [Scansione porte esterna (deployment)](../deployment/port-scan.md).

## Quando appare il pannello

Il pannello è visibile solo con `PORT_SCAN_ENABLED=true` nell'ambiente app. Se disabilitato, la pagina server mostra solo le regole UFW.

## Avviare una scansione

1. Aprite una dashboard server.
2. Nella toolbar dashboard UFW, fate clic su **Scan ports** (o usate la sezione scansione porte se mostrata sotto la tabella regole).
3. Appare un banner operazioni con passaggi: resolve target → discovery → enrichment → normalize.
4. I risultati popolano la tabella quando la scansione termina con successo.

La discovery TCP completa (porte 1–65535) può richiedere **30 minuti o più**. La scansione parte dal container app verso l'hostname o IP registrato del server — non via SSH.

## Stati scansione

| Stato | Significato | Comportamento UI |
|--------|---------|--------------|
| **PENDING** | Job scan creato, non ancora avviato | Mostra *Scanning...*; polling attivo |
| **RUNNING** | Naabu/Nmap in corso | Progresso via banner operazioni; tabella vuota o risultati precedenti |
| **SUCCESS** | Scansione terminata | Tabella risultati completa; data e conteggio porte nell'intestazione pannello |
| **FAILED** | Errore o timeout | Messaggio errore mostrato; risultati precedenti riusciti possono restare visibili |

## Ripresa dopo refresh pagina

Da v0.9.2, aprire una pagina server carica l'**ultima scansione di qualsiasi stato** dal database — non solo l'ultima riuscita. Se aggiornate il browser mentre una scansione è `PENDING` o `RUNNING`, il pannello riprende il polling e il banner operazioni rileva l'operazione attiva.

## Tabella risultati

| Colonna | Descrizione |
|--------|-------------|
| **Port** | Numero porta TCP |
| **Proto** | Protocollo (tipicamente `tcp`) |
| **State** | Di solito `open` per porte scoperte |
| **Service** | Nome servizio da Nmap quando disponibile |
| **Product / Version** | Stringa prodotto e versione se rilevata |
| **UFW** | Copertura rispetto all'ultimo snapshot UFW |

### Valori copertura UFW

La copertura usa **semantica scansione esterna** — cosa vedrebbe un client anonimo su internet:

| Valore | Significato |
|-------|---------|
| **Allowed** | ALLOW/LIMIT in ingresso da **qualsiasi** sorgente copre questa porta |
| **Not in UFW** | Porta aperta esternamente ma non coperta da regola allow pubblica in ingresso — revisione |
| **Denied** | DENY/REJECT in ingresso da **qualsiasi** sorgente colpisce questa porta |
| **Unknown** | UFW inattivo o nessuno snapshot disponibile |

Le regole solo whitelist (IP/CIDR sorgente specifico, o `To Port = any` senza allow pubblico) **non** contano come *Allowed* ai fini della scansione esterna.

## Sovrapposizione e limiti di frequenza

| Situazione | Messaggio / comportamento |
|-----------|---------------------|
| Scansione già in corso su questo server | *È già in corso una scansione delle porte per questo server.* — attendete il completamento |
| Scansione ripetuta entro 30 secondi | Messaggio limite frequenza con countdown retry |

È consentita solo una scansione attiva per server. La scansione porte non blocca refresh o apply UFW sullo stesso server.

## Relazione con statistiche elenco server

La scheda **elenco server** può mostrare un conteggio porte aperte dall'ultima scansione riuscita. La riga inventario dashboard mostra data scan e conteggio risultati quando esiste scansione riuscita.

I conteggi regole salvate sulle schede elenco si riferiscono ai **metadati regola locali** (`ruleRecord`), non ai numeri regola UFW remoti.

## Cronologia operazioni

Ogni scansione crea una voce log operazioni di tipo `port.scan`. Gli eventi audit `PORT_SCAN_STARTED` e `PORT_SCAN_COMPLETED` sono registrati all'avvio e al termine riuscito.

Vedi [Cronologia operazioni](./operations-history.md).

## Documenti correlati

- [Scansione porte esterna (deployment)](../deployment/port-scan.md)
- [Operazioni e concorrenza](../concepts/operations-and-concurrency.md)
- [Gestire i server](./manage-servers.md)
