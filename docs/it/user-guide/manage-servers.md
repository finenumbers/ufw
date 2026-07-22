# Gestire i server

Questa guida copre il ciclo di vita del server: aggiungere, dashboard, aggiornare, installare UFW, modificare, eliminare e statistiche elenco.

## Prerequisiti

Create almeno un'[identità SSH](../concepts/ssh-identities.md) prima di aggiungere un server.

## Aggiungere un server

1. Barra laterale → **Server** → **Aggiungi server**
2. Compilate nome, host, porta, selezionate identità
3. **Crea server** — SSH verificato automaticamente all'invio
4. In caso di successo, aprite la dashboard del server

Se la verifica fallisce, controllate raggiungibilità host, credenziali, firewall che consente SSH dall'host Docker e [validazione host](../concepts/servers-and-ssh.md).

## Dashboard server

La dashboard carica lo **stato UFW in cache** dall'ultimo snapshot Postgres — nessuna SSH al primo render.

Con scansione porte abilitata, il pannello scan carica l'**ultima scansione di qualsiasi stato** da Postgres (incluse scansioni in corso da v0.9.2).

| Stato UFW | Azioni |
|------------|---------|
| Non installato | **Aggiorna stato**, poi **Installa UFW** (dopo che l'aggiornamento conferma l'assenza) |
| Installato ma inattivo | **Aggiorna stato** — pulsante installa nascosto se UFW esiste ma è inattivo |
| Installato e attivo | **Aggiungi regola**, **Salva regole**, **Aggiorna stato**, opzionale **Scan ports** |

**Aggiorna stato** esegue SSH live, aggiorna lo snapshot e sincronizza la tabella regole. **Installa UFW** resta disabilitato finché l'aggiornamento non conferma che UFW non è installato.

Fino all'aggiornamento, il badge UFW può mostrare un'etichetta **cache** dall'ultimo snapshot.

### Avviso modifiche non salvate

Se avete modifiche bozza non salvate, l'aggiornamento chiede conferma prima di ricaricare dal server.

### Sync iniziale automatica

Quando **nessuno snapshot UFW esiste** in Postgres (server nuovo, mai aggiornato), un'operazione sync in background viene eseguita una volta per popolare la cache. Osservate il banner operazioni.

## Statistiche regole e porte

| Posizione | Metrica | Significato |
|----------|--------|---------|
| Scheda **elenco server** | regole salvate | Conteggio locale `ruleRecord` |
| Scheda **elenco server** | porte aperte | Ultimi risultati scan riusciti (se abilitato) |
| Badge **dashboard** | in tabella | Conteggio righe tabella regole visibile |

*In tabella* sulla dashboard può differire da *regole salvate* durante modifica o prima dell'apply.

## Modificare un server

1. Pagina server → **Modifica**
2. Modificate nome, host, porta o identità
3. SSH verificato all'invio quando i parametri di connessione sono cambiati

La pagina modifica mostra l'impronta chiave host e avviso **non verificata** se applicabile.

## Eliminare un server

**Zona pericolosa** sulla pagina modifica:

- Rimuove regole locali, bozze, snapshot, scansioni per questo server
- **Non** modifica UFW remoto

Confermate solo quando rimuovete dati di gestione, non quando cancellate regole firewall remote.

## Strumenti configurazione elenco server

- **Salva configurazione** / **Carica configurazione** — export/import JSON v2 completo — vedi [Importazione ed esportazione configurazione](../concepts/import-export-config.md)

## Documenti correlati

- [Server e SSH](../concepts/servers-and-ssh.md)
- [Modificare e applicare regole](./edit-and-apply-rules.md)
- [Scansione porte](./port-scan.md)
