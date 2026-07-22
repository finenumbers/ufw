# Port scan (user guide)

When enabled by your administrator, the **port scan panel** on each server page discovers externally reachable TCP services and compares them with your UFW rules.

Administrators enable and tune scanning via environment variables — see [External port scanning (deployment)](../deployment/port-scan.md).

## When the panel appears

The panel is visible only when `PORT_SCAN_ENABLED=true` in the app environment. If disabled, the server page shows UFW rules only.

## Starting a scan

1. Open a server dashboard.
2. In the UFW dashboard toolbar, click **Scan ports** (or use the port scan section if shown below the rules table).
3. An operation banner appears with steps: resolve target → discovery → enrichment → normalize.
4. Results populate in the table when the scan completes successfully.

Full TCP discovery (ports 1–65535) can take **30 minutes or more**. The scan runs from the app container toward the server's registered hostname or IP — not over SSH.

## Scan states

| Status | Meaning | UI behaviour |
|--------|---------|--------------|
| **PENDING** | Scan job created, not started yet | Shows *Scanning…*; polling active |
| **RUNNING** | Naabu/Nmap in progress | Progress via operation banner; table may be empty or show previous results |
| **SUCCESS** | Scan finished | Full findings table; date and port count in panel header |
| **FAILED** | Error or timeout | Error message shown; previous successful results may still display |

## Resume after page refresh

Since v0.9.2, opening a server page loads the **latest scan of any status** from the database — not only the last successful one. If you refresh the browser while a scan is `PENDING` or `RUNNING`, the panel resumes polling and the operation banner picks up the active operation.

## Results table

| Column | Description |
|--------|-------------|
| **Port** | TCP port number |
| **Proto** | Protocol (typically `tcp`) |
| **State** | Usually `open` for discovered ports |
| **Service** | Service name from Nmap when available |
| **Product / Version** | Product and version string when detected |
| **UFW** | Coverage relative to your latest UFW snapshot |

### UFW coverage values

Coverage uses **external-scan semantics** — what an anonymous client on the internet would see:

| Value | Meaning |
|-------|---------|
| **Allowed** | Inbound ALLOW/LIMIT from **any** source covers this port |
| **Not in UFW** | Port is open externally but not covered by a public inbound allow rule — review |
| **Denied** | Inbound DENY/REJECT from **any** source targets this port |
| **Unknown** | UFW inactive or no snapshot available |

Whitelist-only rules (specific source IP/CIDR, or `To Port = any` without a public allow) do **not** count as *Allowed* for external scan purposes.

## Overlap and rate limits

| Situation | Message / behaviour |
|-----------|---------------------|
| Scan already running on this server | *A port scan is already running for this server.* — wait for completion |
| Repeat scan within 30 seconds | Rate limit message with retry countdown |

Only one active scan per server is allowed at a time. Port scan does not block UFW refresh or apply on the same server.

## Relationship to server list stats

The **servers list** card may show an open-port count from the latest successful scan. The dashboard inventory line shows scan date and finding count when a successful scan exists.

Saved rule counts on list cards refer to **local rule metadata** (`ruleRecord`), not remote UFW rule numbers.

## Operations history

Each scan creates an operation log entry of type `port.scan`. Audit events `PORT_SCAN_STARTED` and `PORT_SCAN_COMPLETED` are recorded on start and successful finish.

See [Operations history](./operations-history.md).

## Related docs

- [External port scanning (deployment)](../deployment/port-scan.md)
- [Operations and concurrency](../concepts/operations-and-concurrency.md)
- [Manage servers](./manage-servers.md)
