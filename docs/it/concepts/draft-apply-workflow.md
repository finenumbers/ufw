# Workflow bozza e applicazione

UFW Remote Manager non invia mai modifiche al firewall in silenzio. Ogni mutazione segue **modifica → anteprima → conferma → applicazione**.

![Workflow di applicazione](../../assets/ufw-apply-workflow.svg)

## Passaggi

### 1. Modifica bozza

Modifica le regole nella tabella: aggiungi, modifica, elimina, riordina, importa. Le modifiche restano nella **bozza locale** finché non vengono applicate.

### 2. Anteprima applicazione

Clicca **Anteprima applicazione**. L'app:

1. Carica lo stato UFW corrente dal server (snapshot SSH)
2. Calcola un **piano** — comandi che allineerebbero UFW alla tua bozza
3. Mostra regole aggiunte, rimosse e riordinate

Rivedi l'anteprima con attenzione. Presta attenzione alle regole che potrebbero bloccarti fuori (es. blocco SSH).

### 3. Conferma

Conferma nella finestra di dialogo. Solo allora i comandi UFW vengono eseguiti via SSH.

### 4. Esecuzione applicazione

I comandi vengono eseguiti in sequenza sul server (coda per server, concorrenza 1). Il progresso appare nel **banner operazioni** con stato passo per passo.

### 5. Sincronizzazione post-applicazione

Dopo il successo, l'app aggiorna lo snapshot e sincronizza gli stati di origine della bozza così i colori delle righe riflettono la nuova realtà.

## Diagramma di sequenza

```mermaid
sequenceDiagram
  participant User
  participant App as ufw_app
  participant DB as Postgres
  participant Remote as Linux_UFW

  User->>App: Edit draft rules
  User->>App: Preview apply
  App->>Remote: SSH read snapshot
  App->>App: Build plan diff
  User->>App: Confirm apply
  App->>Remote: SSH read snapshot
  alt Remote changed since preview
    App-->>User: Reject — re-preview required
  else Plan matches
    App->>Remote: SSH ufw commands
    App->>DB: Update snapshot and audit
  end
```

## Applicazione parziale e deriva

UFW remoto può cambiare tra anteprima e conferma, oppure l'applicazione può fallire a metà. L'app gestisce tre casi distinti:

| Scenario | Stato sessione | Cosa fare |
|----------|----------------|------------|
| UFW remoto cambiato **tra anteprima e conferma** | Apply rifiutato (`needsRePreview`) | Esegui di nuovo **Anteprima applicazione** — non forzare resync |
| Comandi UFW **interrotti** sul server | `PARTIAL` (`needsResync`) | **Risincronizzazione forzata dal server**, poi rivedi prima di modificare |
| Comandi UFW riusciti ma **sync post-applicazione fallita** | `PARTIAL` (`needsResync`) | **Risincronizzazione forzata dal server** — UFW remoto già modificato |

**Non ignorare mai gli avvisi di applicazione parziale** — continuare alla cieca può causare regole duplicate o errori di ordine.

## Salvaguardia Allow SSH

Il pianificatore di applicazione include salvaguardie sulle regole di accesso SSH dove configurato — vedi i test in `src/lib/ufw/commands.allow-ssh.test.ts`. Verifica comunque l'anteprima manualmente per i server di produzione.

## Documentazione correlata

- [Regole UFW e stati](./ufw-rules-and-states.md)
- [Modificare e applicare regole](../user-guide/edit-and-apply-rules.md)
- [Cronologia operazioni](../user-guide/operations-history.md)
