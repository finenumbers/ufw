# Importazione ed esportazione configurazione

Puoi esportare e importare una **configurazione completa dei server** (tutti i server, identità, metadati regole) come JSON **v2**.

## Esportazione

1. Dalla pagina **Server**, usa **Salva configurazione**
2. Reinserisci la **password dell'account** (autenticazione step-up)
3. Scarica il file JSON

### Avviso di sicurezza importante

Il file di export contiene **password SSH e chiavi private in testo chiaro**. Trattalo come un segreto:

- Conservalo crittografato (vault password manager, disco crittografato)
- Non committarlo mai in git o inviarlo su canali non sicuri
- Viene scritto un evento di audit `CONFIG_EXPORT` quando l'export riesce

## Importazione

1. Usa **Carica configurazione** nella pagina Server
2. Seleziona file JSON v2
3. Rivedi il riepilogo: server da creare, aggiornare, eliminare
4. Conferma — l'importazione avviene in una transazione (upsert prima, eliminazione per ultimo)

### Comportamento distruttivo

I server **assenti** dal file di importazione possono essere **eliminati** insieme a tutte le regole e snapshot. Leggi attentamente la finestra di conferma.

Le chiavi host SSH importate possono essere contrassegnate come **non verificate** finché non esegui test SSH su ogni server.

## Export vs backup Postgres

| Metodo | Contiene | Ideale per |
|--------|----------|----------|
| **Export configurazione (JSON)** | Configurazione leggibile + segreti in testo chiaro | Migrazione tra istanze, copia disaster |
| **Dump Postgres** | Database completo inclusi segreti crittografati | Ripristino completo con la stessa `APP_ENCRYPTION_KEY` |
| **Backup `.env`** | Segreti di runtime | Obbligatorio per decrittografare credenziali DB dopo ripristino |

Per un disaster recovery completo, esegui backup di **Postgres e `.env`** — vedi [Backup e ripristino](../operations/backup-restore.md).

## Documentazione correlata

- [Log di audit ed esportazione](../administration/audit-log-and-export.md)
- [Identità SSH](./ssh-identities.md)
