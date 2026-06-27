# Operations history

Long-running tasks (apply, refresh, install UFW, port scan, Docker inventory) are tracked in **operation logs** and shown in the UI.

## Operation banner

While an operation runs, a banner appears at the top of the app:

- Operation type and status (RUNNING, SUCCESS, FAILED)
- Expandable step list with per-step status
- Auto-dismiss on success after a short delay

The banner polls for updates while work is in progress.

If a banner appears stuck on **RUNNING** or **PENDING** after a browser disconnect, refresh the page. Stale operations are cleared automatically by a background sweep (typically within 30–60 minutes).

## Operations page

Sidebar → **Operations history** (`/operations`)

Two tabs:

| Tab | Content |
|-----|---------|
| **Operations** | Technical operation log — apply, sync, refresh, port scan, Docker, etc. |
| **Audit** | Security-relevant events — login, logout, config export |

Both support infinite scroll for older entries.

## Operation types

The database stores dotted type names (for example `ufw.refresh`). The UI translates them with underscore keys (for example `ufw_refresh`).

Active examples:

- `apply_rules` / `apply.rules` — UFW apply
- `ufw_refresh` / `ufw.refresh` — Refresh Status (live SSH read + rules sync)
- `ufw_sync` / `ufw.sync` — background initial sync when no snapshot exists
- `ufw_install` / `ufw.install` — UFW install (enable runs inside install)
- `port_scan` / `port.scan` — external port scan
- `docker_inventory` / `docker.inventory` — Docker inventory refresh
- `docker_control` / `docker.control` — container start/stop/restart
- `server_create` / `server.create` — new server added

Legacy (historical log entries only):

- `ssh_test` — from releases before v0.7.4; no longer created

## Clearing history

Administrators can clear old operation history from the UI (audit events may be retained per retention policy). Clearing does not affect server state or rules.

## Related docs

- [Audit log and export](../administration/audit-log-and-export.md)
- [Draft and apply workflow](../concepts/draft-apply-workflow.md)
