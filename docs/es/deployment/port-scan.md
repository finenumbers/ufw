# External port scanning

UFW Remote Manager can run an **external port scan** from the `ufw-app` container toward each registered server's `host` address. The pipeline uses:

1. **Naabu** — fast TCP discovery (`host/port/protocol/open`)
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
| `PORT_SCAN_TOP_PORTS` | `1000` | Naabu top-ports profile |
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Max ports sent to Nmap enrichment |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `300000` | Discovery timeout |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Enrichment timeout |
| `PORT_SCAN_RATE_LIMIT_WINDOW_MS` | `900000` | Min interval between scans per server |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Stored scan runs per server |

## Network requirements

The app container must reach **managed server hosts on scanned TCP ports**, not only SSH `:22`. Ensure routing/firewall rules allow egress from the Docker host (or `ufw-app` network) to target servers.

This feature scans **only hosts already registered in UFW Remote Manager** — arbitrary targets are rejected.

## UFW coverage column

Each open port is compared with the latest UFW snapshot:

| Value | Meaning |
|-------|---------|
| **Allowed** | An ALLOW rule covers this port/protocol |
| **Not in UFW** | Port is open externally but not covered by ALLOW — review |
| **Denied** | Explicit DENY/REJECT may apply |
| **Unknown** | UFW inactive or no snapshot |

## Security notes

- Rate-limited (one scan per server per 15 minutes by default)
- Audit events: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Scans run in the per-server queue alongside SSH operations (serialized)
- Uses connect scans (`naabu -scan-type c`, `nmap -sT`) — no raw socket capabilities required

## Related docs

- [Deployment overview](./overview.md)
- [Security model](../administration/security-model.md)
