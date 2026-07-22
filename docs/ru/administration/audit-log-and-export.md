# Журнал аудита и экспорт

Две complementary trails: **operation logs** (task progress) и **audit events** (security and compliance).

## Audit events

Written to Postgres on sensitive actions. Examples:

| Action | When |
|--------|------|
| `LOGIN` / `LOGOUT` | Session start/end |
| `APPLY_PREVIEWED` / `APPLY_CONFIRMED` / `APPLY_COMPLETED` / `APPLY_FAILED` | Apply workflow |
| `SNAPSHOT_LOADED` | UFW snapshot captured |
| `UFW_ENABLE` | Remote enable after install |
| `PORT_SCAN_STARTED` / `PORT_SCAN_COMPLETED` | Port scan lifecycle |
| `CONFIG_EXPORT` / `CONFIG_IMPORT` | JSON v2 config transfer |
| Server CRUD | Create/update/delete server records |

View on **История операций** → **События аудита** tab with infinite scroll.

Audit retention follows database storage — no automatic purge unless operator clears history.

## Operation logs

Technical records with steps, status, timestamps, and error messages. See [История операций](../user-guide/operations-history.md).

## Configuration export audit

Each successful **Сохранить конфигурацию** creates audit entry. Export file contains **decrypted SSH secrets** — protect like password vault dump.

Export flow:

1. Password confirmation (step-up)
2. Short-lived download token
3. JSON download via API route

Rate limit: 5 exports per minute per user.

## Clearing history

**Очистить историю** on operations page removes operation log entries per UI action. Does not roll back server changes or delete audit events in all cases — confirm dialog text for current behaviour.

Does not modify remote UFW or local rule drafts.

## Связанные документы

- [Импорт и экспорт конфигурации](../concepts/import-export-config.md)
- [Модель безопасности](./security-model.md)
