# External port scanning

UFW Remote Manager can run an **external port scan** from the `ufw-app` container toward each registered server's `host` address. The pipeline uses:

1. **Naabu** — TCP discovery on ports 1–65535 (`host/port/protocol/open`)
2. **Nmap** — service detection only on discovered ports (`-sV`, XML output)

Results appear in a table **below the UFW rules** on the server page.

## Enable

Set in the app environment (Compose / Portainer):

```env
PORT_SCAN_ENABLED=true
```

Optional tuning:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max ports sent to Nmap enrichment |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Full-port discovery timeout (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Enrichment timeout |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Stored scan runs per server |

Repeat scans on the same server are rate-limited to **once every 30 seconds** (fixed in app code since v0.5.1). Legacy `PORT_SCAN_RATE_LIMIT_WINDOW_MS` in `.env` is **ignored**.

## Network requirements

The app container must reach **managed server hosts on scanned TCP ports**, not only SSH `:22`. Ensure routing/firewall rules allow egress from the Docker host (or `ufw-app` network) to target servers.

This feature scans **only hosts already registered in UFW Remote Manager** — arbitrary targets are rejected.

## UFW coverage column

Each open port is compared with the latest UFW snapshot using **external-scan semantics**:

| Value | Meaning |
|-------|---------|
| **Allowed** | Inbound ALLOW/LIMIT from **any** source (`From = any`) covers this port |
| **Not in UFW** | Port is open externally but not covered by a public inbound ALLOW — review |
| **Denied** | Inbound DENY/REJECT from **any** source targets this port |
| **Unknown** | UFW inactive or no snapshot |

Whitelist-only rules (`From = specific IP/CIDR`, `To Port = any`) do **not** count as allowed for external scan. Only rules that explicitly allow traffic from anywhere are treated as public exposure.

## Security notes

- Rate-limited (30 seconds between repeat scans per server; not env-configurable)
- Audit events: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scans run in the per-server queue alongside SSH operations (serialized)
- Uses connect scans (`naabu -scan-type c`, `nmap -sT`) — no raw socket capabilities required

## Progress polling

While a scan runs, the UI polls a lightweight status endpoint (not full SSH re-reads). Polling starts **immediately**, then every **1s** while the operation is active (backs off after ~30 minutes). When the operation banner completes, panels refresh right away. The operation banner polls every **1s** during RUNNING.

## Related docs

- [Deployment overview](./overview.md)
- [Security model](../administration/security-model.md)
