# Operations history

Long-running tasks (apply, refresh, install UFW, SSH test) are tracked in **operation logs** and shown in the UI.

## Operation banner

While an operation runs, a banner appears at the top of the app:

- Operation type and status (RUNNING, SUCCESS, FAILED)
- Expandable step list with per-step status
- Auto-dismiss on success after a short delay

The banner polls for updates while work is in progress.

## Operations page

Sidebar → **Operations history** (`/operations`)

Two tabs:

| Tab | Content |
|-----|---------|
| **Operations** | Technical operation log — apply, sync, SSH test, etc. |
| **Audit** | Security-relevant events — login, logout, config export |

Both support infinite scroll for older entries.

## Operation types

Examples:

- `apply_rules` — UFW apply
- `ufw_refresh` — refresh status and rules
- `ufw_sync` — sync draft with server
- `ufw_install` / `ufw_enable` — UFW setup
- `ssh_test` — connection verification
- `server_create` — new server added

## Clearing history

Administrators can clear old operation history from the UI (audit events may be retained per retention policy). Clearing does not affect server state or rules.

## Related docs

- [Audit log and export](../administration/audit-log-and-export.md)
- [Draft and apply workflow](../concepts/draft-apply-workflow.md)
