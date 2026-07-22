# Управление серверами

Это руководство — lifecycle сервера: add, dashboard, refresh, install UFW, edit, delete и статистика списка.

## Предварительные требования

Создайте хотя бы одну [SSH-идентификацию](../concepts/ssh-identities.md) перед добавлением сервера.

## Добавление сервера

1. Боковая панель → **Серверы** → **Добавить сервер**
2. Имя, host, port, выберите identity
3. **Создать сервер** — SSH verified automatically on submit
4. При успехе откройте dashboard сервера

При failure проверьте reachability, credentials, firewall для SSH с Docker host и [проверку хоста](../concepts/servers-and-ssh.md).

## Dashboard сервера

Dashboard загружает **кэшированное UFW state** из latest Postgres snapshot — без SSH при first paint.

При включённом port scan панель scan загружает **latest scan любого статуса** из Postgres (включая in-progress scans с v0.9.2).

| UFW status | Actions |
|------------|---------|
| Not installed | **Обновить статус**, затем **Установить UFW** (после refresh подтверждает отсутствие) |
| Installed but inactive | **Обновить статус** — install hidden если UFW exists but inactive |
| Installed and active | **Добавить правило**, **Сохранить правила**, **Обновить статус**, optional **Сканировать порты** |

**Обновить статус** — live SSH, snapshot update, rules table sync. **Установить UFW** disabled до refresh подтверждает not installed.

До refresh UFW badge может показывать **cached** label от last snapshot.

### Unsaved edits warning

При unsaved draft changes refresh asks confirmation перед reload с сервера.

### Automatic initial sync

Когда **нет UFW snapshot** в Postgres (new server, never refreshed), background sync once для cache. Смотрите баннер операций.

## Rule and port statistics

| Location | Metric | Meaning |
|----------|--------|---------|
| Card **списка серверов** | сохранённых правил | Local `ruleRecord` count |
| Card **списка серверов** | открытых портов | Latest successful scan findings (when enabled) |
| Badge **dashboard** | в таблице | Visible rules table row count |

Dashboard *в таблице* может differ от *сохранённых правил* while editing или before apply.

## Edit server

1. Server page → **Изменить сервер**
2. Name, host, port или identity
3. SSH verified on submit when connection parameters changed

Edit page shows host key fingerprint и **unverified** warning when applicable.

## Delete server

**Опасная зона** on edit page:

- Removes local rules, drafts, snapshots, scans for this server
- **Does not** change remote UFW

Confirm only when removing management data, not remote firewall rules.

## Servers list configuration tools

- **Сохранить конфигурацию** / **Загрузить конфигурацию** — full JSON v2 — см. [Импорт и экспорт конфигурации](../concepts/import-export-config.md)

## Связанные документы

- [Серверы и SSH](../concepts/servers-and-ssh.md)
- [Редактирование и применение правил](./edit-and-apply-rules.md)
- [Сканирование портов](./port-scan.md)
