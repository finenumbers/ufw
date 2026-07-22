# Редактирование и применение правил

Когда UFW **installed and active**, **таблица правил** на dashboard сервера — основная surface редактирования.

## Возможности таблицы правил

| Feature | Description |
|---------|-------------|
| **Search** | Filter visible rows |
| **Column filters** | Filter by group or name |
| **Group sections** | Expand/collapse grouped rows |
| **Drag-and-drop** | Reorder rules (order affects UFW) |
| **Row colors** | [Origin state](../concepts/ufw-rules-and-states.md) indicators |
| **Inline edit** | Double-click or edit action on row |
| **Add / delete** | Toolbar and row actions |
| **Load more** | Infinite scroll for large rule sets |

## Refresh from server

**Обновить статус** on dashboard (or sync from toolbar):

1. Detect UFW state over SSH
2. Store new snapshot
3. Re-seed table from remote + local metadata

Use after manual CLI changes on server or after partial apply.

Unsaved draft edits trigger confirmation dialog before reload.

## Force resync from server

When UI warns about drift or partial apply, use **Принудительная синхронизация с сервером** to align draft with actual remote snapshot before further edits.

Available from apply preview dialog and related warnings — not substitute for re-preview when remote changed between preview and confirm.

## Import rules

Toolbar → import **CSV**, **XLSX**, or **JSON**:

- Rows merge into draft; duplicates by fingerprint skipped or merged per import rules
- Overlapping IP or CIDR ranges are highlighted **violet** in the table (see [UFW rules and states](../concepts/ufw-rules-and-states.md))
- Validate rows in table before apply preview
- Import affects draft only until apply

## Export rules

Export current table to **XLSX** for offline review or backup. XLSX layout matches import column order for round-trip workflows.

## Apply workflow

1. Edit draft
2. **Apply preview** — review planned commands and summary counts
3. **Confirm** — executes over SSH (rejected if remote changed since preview)
4. Watch **баннер операций** for per-command progress

**Сохранить правила** / apply disabled until SSH host key **verified** — run **Обновить статус** first for imported servers.

See [Черновик и применение](../concepts/draft-apply-workflow.md).

## Safety tips

- Keep at least one rule allowing SSH from admin network before deny rules
- Run preview on production during maintenance window
- Check **История операций** after apply for SUCCESS or FAILED

## Связанные документы

- [Правила UFW и состояния](../concepts/ufw-rules-and-states.md)
- [История операций](./operations-history.md)
