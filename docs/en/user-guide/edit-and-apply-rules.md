# Edit and apply rules

When UFW is **installed and active**, the **rules table** on the server dashboard is the main editing surface.

## Rules table features

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

**Refresh Status** on the dashboard (or sync from toolbar):

1. Detect UFW state over SSH
2. Store new snapshot
3. Re-seed table from remote + local metadata

Use after manual CLI changes on the server or after partial apply.

Unsaved draft edits trigger a confirmation dialog before reload.

## Force resync from server

When the UI warns about drift or partial apply, use **Force resync from server** to align the draft with the actual remote snapshot before further edits.

Available from the apply preview dialog and related warnings — not a substitute for re-preview when remote changed between preview and confirm.

## Import rules

Toolbar → import **CSV**, **XLSX**, or **JSON**:

- Rows merge into draft; duplicates by fingerprint skipped or merged per import rules
- Overlapping IP or CIDR ranges are highlighted **violet** in the table (see [UFW rules and states](../concepts/ufw-rules-and-states.md#address-overlap-highlight))
- Validate rows in the table before apply preview
- Import affects draft only until apply

## Export rules

Export current table to **XLSX** for offline review or backup. XLSX layout matches import column order for round-trip workflows.

## Apply workflow

1. Edit draft
2. **Apply preview** — review planned commands and summary counts
3. **Confirm** — executes over SSH (rejected if remote changed since preview)
4. Watch **operation banner** for per-command progress

**Save rules** / apply is disabled until SSH host key is **verified** — run **Refresh Status** first for imported servers.

See [Draft and apply workflow](../concepts/draft-apply-workflow.md).

## Safety tips

- Keep at least one rule allowing SSH from your admin network before deny rules
- Run preview on production during a maintenance window
- Check **Operations history** after apply for SUCCESS or FAILED

## Related docs

- [UFW rules and states](../concepts/ufw-rules-and-states.md)
- [Operations history](./operations-history.md)
