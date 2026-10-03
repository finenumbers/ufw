# Aggiornamento e rollback

## Aggiornamento (consigliato)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml --env-file .env up -d
```

Il servizio **migrate** esegue `prisma migrate deploy` automaticamente.

Verificate:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Note versione

| Versione | Migrazione | Modifiche notevoli |
|---------|-----------|-----------------|
| **v0.9.0** | Sì — rimuove tabelle inventario legacy | UI inventario legacy rimossa |
| **v0.9.1** | No | Pulizia legacy, guardrail documentazione |
| **v0.9.2** | No | Fix sync apply, ciclo vita banner operazioni, scansione porte fuori coda SSH, guardia sovrapposizione |

Aggiornando da pre-v0.9.0, assicuratevi che migrate completi — dati inventario legacy eliminati.

Fissate immagine: `GHCR_IMAGE_TAG=v0.9.24` in `.env`.

v0.9.18: AmneziaWG facoltativo solo per i nodi selezionati. Ricreate il contenitore con `NET_ADMIN` e `/dev/net/tun`. La rotta predefinita resta diretta.

v0.9.19: il contrassegno di restrizione TSPU resta nella dashboard e non compare più nella barra laterale.

v0.9.21: dopo il riavvio, l'unica istanza riprende il tunnel AmneziaWG.

v0.9.22: la sincronizzazione UFW di un nodo AmneziaWG passa dal tunnel.

v0.9.23: un nodo AmneziaWG resta raggiungibile quando la sua route /32 è già installata.

v0.9.24: le righe dei server nella barra laterale usano gli stessi riempimenti blu e rosso delle schede della dashboard.

## Rollback

1. Impostate `GHCR_IMAGE_TAG` al tag precedente noto buono
2. `docker compose ... pull && up -d`
3. Se la migrazione è già stata applicata forward-only, può essere necessario ripristinare backup DB più vecchio — testate rollback in staging

Le migrazioni database generalmente **non** vengono annullate automaticamente.

## Zero downtime

App a container singolo — aspettatevi breve restart durante `up -d`. Pianificate finestra manutenzione per produzione.

## Documenti correlati

- [GHCR + Compose](../deployment/ghcr-compose.md)
- [Backup e ripristino](./backup-restore.md)
