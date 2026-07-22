# Log di audit ed esportazione

Esistono due livelli di logging: **log operazioni** (tecnico) ed **eventi di audit** (sicurezza/conformità).

## Eventi di audit

Scritti nella tabella `audit_event`. Esempi:

| Azione | Quando |
|--------|------|
| `LOGIN` | Sessione utente creata |
| `LOGOUT` | Sessione eliminata |
| `CONFIG_EXPORT` | Configurazione server esportata (dopo reinserimento password) |

Visualizza su **Cronologia operazioni** → scheda **Audit**.

## Log operazioni

Scritti per lavoro di lunga durata: apply, refresh, installazione, port scan, ecc. Include metadati passaggi e messaggi successo/errore.

Visualizza su **Cronologia operazioni** → scheda **Operazioni** o nel **banner operazioni** live.

## Traccia audit export configurazione

Ogni export riuscito crea un record audit `CONFIG_EXPORT` con ID utente e timestamp. Usalo per tracciare chi ha scaricato file credenziali in testo chiaro.

## Retention

La retention snapshot mantiene gli ultimi **10** snapshot per server (eliminazione automatica dei più vecchi). La retention log operazioni può essere cancellata manualmente dall'interfaccia.

Pianifica policy di backup per dati audit se la conformità richiede retention lunga — vedi [Backup e ripristino](../operations/backup-restore.md).

## Documentazione correlata

- [Importazione ed esportazione configurazione](../concepts/import-export-config.md)
- [Cronologia operazioni](../user-guide/operations-history.md)
- [SECURITY.md](../../../SECURITY.md)
