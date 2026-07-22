# История операций

Длительные задачи — apply, sync, refresh, install UFW, port scan — записываются в **operation logs** и отображаются в UI.

## Баннер операций

Пока работа выполняется, баннер вверху:

| Element | Description |
|---------|-------------|
| Status | ВЫПОЛНЯЕТСЯ, ОЖИДАНИЕ, УСПЕХ, ОШИБКА, ЧАСТИЧНО |
| Steps | Expandable per-step status |
| Message | Translated progress or error text |

**УСПЕХ** auto-dismiss через ~10 секунд. **ОШИБКА** и **ЧАСТИЧНО** до dismiss.

### Polling behaviour (v0.9.2)

- Poll ~**1 second** while operation RUNNING or PENDING
- **Stops polling when idle** — no background 5-second loop
- Restarts when new operation begins
- On completion dispatches event so server pages refresh SSR data

See [Операции и конкурентность](../concepts/operations-and-concurrency.md).

### Stuck banner

If banner shows ВЫПОЛНЯЕТСЯ after disconnect, refresh page. Background sweeper marks ancient RUNNING failed within ~30–60 minutes.

## Operations page

Боковая панель → **История операций** (`/operations`)

| Tab | Content |
|-----|---------|
| **Журнал операций** | Technical log — apply, sync, refresh, port scan, server create failures |
| **События аудита** | Security events — login, logout, config export, UFW actions |

Both tabs support infinite scroll for older entries.

## Operation types

Database stores dotted names; UI translates them.

| Type | Description |
|------|-------------|
| `apply.rules` | UFW apply session |
| `ufw.refresh` | Обновить статус — live SSH + rules sync |
| `ufw.sync` | Background initial sync when no snapshot |
| `ufw.install` | Remote UFW install and enable |
| `port.scan` | External port scan |
| `server.create` | Server create with SSH failure |

Legacy (historical entries only):

- `ssh_test` — pre v0.7.4; no longer created

## Clearing history

**Очистить историю** removes old operation log entries per retention action. Does not affect servers, rules, or remote UFW.

Audit tab may retain events per policy — see [Журнал аудита и экспорт](../administration/audit-log-and-export.md).

## Связанные документы

- [Операции и конкурентность](../concepts/operations-and-concurrency.md)
- [Черновик и применение](../concepts/draft-apply-workflow.md)
- [Сканирование портов](./port-scan.md)
