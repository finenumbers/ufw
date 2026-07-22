# Правила UFW и состояния

Таблица правил показывает **единое представление**: remote UFW rules, локальные метаданные и правки черновика. **Цвета** строк отражают связь строки с сервером и базой данных.

## Структура правила

Каждая строка содержит:

| Слой | Поля |
|------|------|
| **Core** | action, direction, protocol, addresses, ports, interface, app profile, log mode, comment, IPv6 |
| **UI metadata** | group, name, notes (локально, не отправляются в UFW, кроме comment) |
| **Origin** | sync state, задающий цвет строки |

Fingerprints идентифицируют правила между remote reloads и локальными правками.

## Origin states

| Состояние | Значение цвета | Типичная ситуация |
|-----------|----------------|-------------------|
| **MATCHED** | Remote и локальные метаданные совпадают | Стабильное synced rule |
| **REMOTE_ONLY** | На сервере, нет в локальных метаданных | Новое remote rule после refresh |
| **LOCAL_ONLY** | В локальной БД, нет на сервере | Pending add или удалено remotely |
| **DRAFT_ONLY** | Правка черновика ещё не applied | Новая строка или изменены core fields |
| **CONFLICT** | Тот же fingerprint, разные core fields | Drift — review перед apply |
| **DELETED** | Помечено deleted в черновике | Будет удалено при apply |

Цвета помогают заметить drift **до** apply. После **Принудительная синхронизация с сервером** черновик выравнивается с remote snapshot.

## Два счётчика правил

UI показывает разные counts в разных местах:

| Место | Метка | Считает |
|-------|-------|---------|
| Карточка **списка серверов** | сохранённых правил | Строки в `ruleRecord` (локальные метаданные) |
| Бейдж **dashboard** | в таблице | Строки в active draft session table |

Они расходятся при edit, import или sync. Бейдж dashboard совпадает с длиной видимой таблицы.

## Порядок важен

UFW оценивает правила по порядку. Таблица поддерживает drag-and-drop reorder. Apply может emit order-resync, когда remote numbering расходится с draft order.

## Remote vs локальные метаданные

- **Remote core fields** из parsed `ufw status numbered`
- **Group, name, notes** только в UFW Remote Manager, если не скопированы в UFW rule comments
- Apply пишет core fields на сервер; UI metadata остаётся в Postgres

## Связанные документы

- [Черновик и применение](./draft-apply-workflow.md)
- [Редактирование и применение правил](../user-guide/edit-and-apply-rules.md)
