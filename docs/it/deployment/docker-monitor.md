# Monitoraggio container Docker

UFW Remote Manager può inventariare e controllare i **container Docker** su ogni server registrato via **SSH** (stesso trasporto delle operazioni UFW).

I risultati compaiono in una tabella **sotto il pannello scansione porte** nella pagina del server.

## Abilitare

Impostare nell'ambiente dell'app (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Regolazioni opzionali:

| Variabile | Predefinito | Scopo |
|-----------|-------------|-------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Snapshot inventario memorizzati per server |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | Timeout comandi SSH per Docker CLI |

L'aggiornamento inventario e il controllo container (start/stop/restart) condividono un **cooldown di 30 secondi** per server (fisso nel codice da v0.5.1). I legacy `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` e `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` in `.env` vengono **ignorati**.

## Requisiti sui server gestiti

- **Docker CLI** installato (`docker` in PATH)
- Daemon Docker raggiungibile per l'utente SSH
- Appartenenza al gruppo **`docker`** o **sudo senza password** per `docker`

L'app prova prima `docker …`, poi `sudo docker …` se il permesso viene negato.

## Funzionalità (MVP)

- Aggiorna inventario: `docker ps -a`, statistiche per container in esecuzione
- Tabella: nome, immagine, stato, health, porte, CPU/memoria, label Compose
- Raggruppamento per progetto Compose
- Drawer dettaglio container (`docker inspect`, variabili env mascherate)
- Controllo: **start**, **stop**, **restart** (conferma per stop/restart)
- Banner progresso operazione + eventi audit

## Sicurezza

- Feature flag (disabilitato per impostazione predefinita)
- Validazione ID/nome container — nessuna shell arbitraria dall'interfaccia
- Solo azioni di controllo fisse
- Rate limit fissi di 30s su aggiornamento e controllo (non configurabili via env)
- Audit: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Polling progresso

Durante l'aggiornamento inventario, l'interfaccia effettua polling su un endpoint di stato leggero. L'intervallo di polling aumenta: **3s → 5s → 10s**. Il banner operazione mostra il progresso per passo.

## Documentazione correlata

- [Panoramica distribuzione](./overview.md)
- [Modello di sicurezza](../administration/security-model.md)
