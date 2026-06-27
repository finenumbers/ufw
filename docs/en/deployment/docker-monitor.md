# Docker container monitoring

UFW Remote Manager can inventory and control **Docker containers** on each registered server over **SSH** (same transport as UFW operations).

Results appear in a table **below the port scan panel** on the server page.

## Enable

Set in the app environment (Compose / Portainer):

```env
DOCKER_MONITOR_ENABLED=true
```

Optional tuning:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOCKER_INVENTORY_HISTORY_LIMIT` | `10` | Stored inventory snapshots per server |
| `DOCKER_COMMAND_TIMEOUT_MS` | `60000` | SSH command timeout for Docker CLI |

Inventory refresh and container control (start/stop/restart) share a **30 second** cooldown per server (fixed in app code since v0.5.1). Legacy `DOCKER_REFRESH_RATE_LIMIT_WINDOW_MS` and `DOCKER_CONTROL_RATE_LIMIT_WINDOW_MS` in `.env` are **ignored**.

## Requirements on managed servers

- **Docker CLI** installed (`docker` in PATH)
- Docker daemon reachable for the SSH user
- Either membership in the **`docker`** group or **passwordless sudo** for `docker`

The app tries `docker …` first, then `sudo docker …` if permission is denied.

## Features (MVP)

- Refresh inventory: `docker ps -a`, stats for running containers
- Table: name, image, status, health, ports, CPU/memory, Compose labels
- Grouping by Compose project
- Container detail drawer (`docker inspect`, masked env vars)
- Control: **start**, **stop**, **restart** (confirm for stop/restart)
- Operation progress banner + audit events

## Security

- Feature flag (default off)
- Container ID/name validation — no arbitrary shell from UI
- Fixed control actions only
- Fixed 30s rate limits on refresh and control (not env-configurable)
- Audit: `DOCKER_INVENTORY_REFRESHED`, `DOCKER_CONTAINER_*`

## Progress polling

While inventory refresh runs, the UI polls a lightweight status endpoint. Poll interval backs off: **3s → 5s → 10s**. The operation banner shows step progress.

## Related docs

- [Deployment overview](./overview.md)
- [Security model](../administration/security-model.md)
