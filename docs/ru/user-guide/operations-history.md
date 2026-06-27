# История операций

Длительные задачи (apply, refresh, установка UFW, port scan, Docker inventory) записываются в **operation logs** и отображаются в интерфейсе.

## Баннер операции

Пока операция выполняется, вверху приложения показывается баннер:

- Тип и статус (RUNNING, SUCCESS, FAILED)
- Разворачиваемый список шагов
- Автоскрытие при успехе через короткую задержку

Баннер опрашивает статус, пока работа идёт.

Если баннер «застрял» на **RUNNING** или **PENDING** после разрыва соединения, обновите страницу. Устаревшие операции очищаются фоновым sweep (обычно за 30–60 минут).

## Страница операций

Боковое меню → **История операций** (`/operations`)

Две вкладки:

| Вкладка | Содержимое |
|---------|------------|
| **Operations** | Технический log — apply, sync, refresh, port scan, Docker и т. д. |
| **Audit** | События безопасности — login, logout, config export |

Обе поддерживают бесконечную прокрутку для старых записей.

## Типы операций

В БД типы с точками (например `ufw.refresh`). В UI переводятся ключами с подчёркиванием (например `ufw_refresh`).

Активные примеры:

- `apply_rules` / `apply.rules` — apply UFW
- `ufw_refresh` / `ufw.refresh` — **Обновить статус** (live SSH + sync правил)
- `ufw_sync` / `ufw.sync` — фоновая initial sync при отсутствии snapshot
- `ufw_install` / `ufw.install` — установка UFW (enable внутри install)
- `port_scan` / `port.scan` — внешний port scan
- `docker_inventory` / `docker.inventory` — refresh Docker inventory
- `docker_control` / `docker.control` — start/stop/restart контейнера
- `server_create` / `server.create` — новый сервер

Legacy (только исторические записи):

- `ssh_test` — из релизов до v0.7.4; больше не создаётся

## Очистка истории

Администратор может очистить старую историю операций в UI (audit-события могут сохраняться по политике retention). Очистка не влияет на состояние серверов и правила.

## Связанные документы

- [Audit log and export](../administration/audit-log-and-export.md)
- [Draft and apply workflow](../concepts/draft-apply-workflow.md)
