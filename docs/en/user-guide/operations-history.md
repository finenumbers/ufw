# Operations history

Long-running tasks — apply, sync, refresh, install UFW, port scan — are tracked in **operation logs** and surfaced in the UI.

## Operation banner

While work runs, a banner appears at the top:

| Element | Description |
|---------|-------------|
| Status | RUNNING, PENDING, SUCCESS, FAILED, PARTIAL |
| Steps | Expandable per-step status |
| Message | Translated progress or error text |

**SUCCESS** auto-dismisses after ~10 seconds. **FAILED** and **PARTIAL** remain until dismissed.

### Polling behaviour (v0.9.2)

- Polls ~**1 second** while operation is RUNNING or PENDING
- **Stops polling when idle** — no background 5-second loop
- Restarts when a new operation begins
- On completion, dispatches event so server pages refresh SSR data

See [Operations and concurrency](../concepts/operations-and-concurrency.md).

### Stuck banner

If banner shows RUNNING after disconnect, refresh the page. Background sweeper marks ancient RUNNING operations failed within ~30–60 minutes.

## Operations page

Sidebar → **Operations history** (`/operations`)

| Tab | Content |
|-----|---------|
| **Operations** | Technical log — apply, sync, refresh, port scan, server create failures |
| **Audit** | Security events — login, logout, config export, UFW actions |

Both tabs support infinite scroll for older entries.

## Operation types

Database stores dotted names; UI translates them.

| Type | Description |
|------|-------------|
| `apply.rules` | UFW apply session |
| `ufw.refresh` | Refresh Status — live SSH + rules sync |
| `ufw.sync` | Background initial sync when no snapshot |
| `ufw.install` | Remote UFW install and enable |
| `ufw.enable` | Activate UFW when already installed |
| `port.scan` | External port scan |
| `server.create` | Server create with SSH failure |

Legacy (historical entries only):

- `ssh_test` — pre v0.7.4; no longer created

## Clearing history

**Clear history** removes operation log entries and audit events from the database (a single purge audit record remains). Does not affect servers, rules, or remote UFW.

## Related docs

- [Operations and concurrency](../concepts/operations-and-concurrency.md)
- [Draft and apply workflow](../concepts/draft-apply-workflow.md)
- [Port scan](./port-scan.md)
