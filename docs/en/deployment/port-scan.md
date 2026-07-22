# External port scanning (deployment)

Administrators enable external port scanning via environment variables. User-facing usage: [Port scan (user guide)](../user-guide/port-scan.md).

## What it does

From the **ufw-app** container, the app scans each registered server's `host` address:

1. **Naabu** — TCP discovery ports 1–65535
2. **Nmap** — service detection on discovered ports

Results stored in Postgres and shown on the server page. **No SSH** is used for scanning.

## Enable

```env
PORT_SCAN_ENABLED=true
```

Restart app container after change. Image must include Naabu and Nmap (official Dockerfile does).

## Optional tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Cap ports sent to Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Discovery timeout (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Enrichment timeout (10 min) |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Scans retained per server |

## Network requirements

App container must reach **managed server hosts on scanned TCP ports**, not only SSH `:22`. Allow egress from Docker host (or app network) to target servers.

Only **registered server hosts** are scanned — arbitrary targets rejected.

## Concurrency (v0.9.2)

| Topic | Behaviour |
|-------|-----------|
| SSH queue | Port scan **does not** use per-server SSH queue — UFW refresh/apply not blocked for 30+ min |
| Overlap | Only one PENDING/RUNNING scan per server; second start rejected |
| Rate limit | 30 seconds between scan starts per server (fixed in code) |
| SSR | Server page loads latest scan of **any status** — in-progress scans resume after refresh |

Findings persist via atomic replace (`deleteMany` + `createMany` in one transaction).

## UFW coverage

See [Port scan user guide](../user-guide/port-scan.md#ufw-coverage-values) for column semantics.

## Security

- Audit: `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Connect scans only (`-sT`) — no raw socket capabilities required
- Disabled by default

## Related docs

- [Environment variables](../administration/environment-variables.md)
- [Architecture](../architecture.md)
- [Operations and concurrency](../concepts/operations-and-concurrency.md)
