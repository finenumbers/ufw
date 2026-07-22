# Импорт и экспорт конфигурации

Экспорт и импорт файла **JSON v2** со всеми серверами, SSH-идентификациями (включая расшифрованные секреты) и связанными метаданными. Для backup, migration или disaster recovery — не для ежедневного редактирования правил.

Import/export на уровне правил (CSV, XLSX) отдельно — см. [Редактирование и применение правил](../user-guide/edit-and-apply-rules.md).

## Export flow

1. Список **Серверы** → **Сохранить конфигурацию**
2. Введите **пароль** учётной записи (step-up authentication)
3. Скачайте JSON (`servers-config-YYYY-MM-DD.json`)

Export включает расшифрованные SSH secrets. Храните файл encrypted at rest; удалите когда не нужен.

Short-lived token защищает download API после password confirmation.

Rate limit: 5 exports в минуту на пользователя.

## Import flow

1. **Загрузить конфигурацию** → выберите JSON
2. **Preview** показывает diff: servers и identities to create, update или delete
3. Confirm с паролем → import применяет изменения

Import ждёт idle per-server queues и блокирует destructive operations при конфликте с active work.

## JSON v2 format

| Section | Contents |
|---------|----------|
| **version** | `2` |
| **identities** | Name, username, auth method, secrets |
| **servers** | Name, host, port, identity reference, host key fields |

Legacy array-only или v1 files rejected.

Duplicate keys (same host + port + identity) rejected at parse time.

## Delete semantics on import

Servers в БД, но отсутствующие в imported file, попадают в preview **delete** set. Confirm только если намерены удалить server records и все associated rules, drafts, snapshots locally.

Remote UFW на deleted server records **не** изменяется.

## Связанные документы

- [SSH-идентификации](./ssh-identities.md)
- [Резервное копирование и восстановление](../operations/backup-restore.md)
- [Журнал аудита и экспорт](../administration/audit-log-and-export.md)
