# Редактирование и применение правил

Когда UFW **установлен и активен** на сервере, **таблица правил** на dashboard сервера позволяет управлять firewall rules.

## Таблица правил

Возможности:

- Поиск и фильтры по колонкам
- Секции групп с expand/collapse
- Drag-and-drop reorder (порядок важен для UFW)
- Цвета строк по [состоянию sync](../concepts/ufw-rules-and-states.md)
- Добавить строку, inline edit, удалить строку

## Обновление с сервера

Используйте **Обновить статус** на dashboard (или refresh из toolbar правил), чтобы:

1. Определить состояние UFW по SSH
2. Загрузить новый snapshot с сервера
3. Пересобрать таблицу правил из remote + локальных метаданных

При **несохранённых правках** приложение показывает диалог подтверждения перед перезагрузкой с сервера.

Используйте после ручных изменений на CLI сервера или после partial apply.

## Force resync

Если UI предупреждает о drift или partial apply, используйте **Force resync from server**, чтобы выровнять черновик по фактическому remote snapshot перед дальнейшим редактированием.

## Import правил

Toolbar → import CSV, XLSX или JSON. Проверьте импортированные строки в таблице перед apply preview.

## Apply workflow

1. Внесите правки в черновик
2. **Apply preview** — просмотрите planned commands и diff summary
3. **Confirm** — выполнение по SSH (отклоняется, если remote UFW изменился после preview — запустите preview снова)
4. Следите за operation banner

**Сохранить правила** (apply preview) заблокировано, пока SSH host key **не verified** — сначала выполните **Обновить статус**, если сервер импортирован из конфигурации.

Подробнее см. [Draft and apply workflow](../concepts/draft-apply-workflow.md).

## Советы по безопасности

- Оставьте хотя бы одно правило, разрешающее SSH из admin-сети, перед apply deny rules
- Запускайте preview в production в maintenance window
- Проверяйте **Историю операций** после apply на SUCCESS или FAILED

## Связанные документы

- [UFW rules and states](../concepts/ufw-rules-and-states.md)
- [Operations history](./operations-history.md)
