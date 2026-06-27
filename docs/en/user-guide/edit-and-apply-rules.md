# Edit and apply rules

When UFW is **installed and active** on a server, open the **Rules** tab to manage firewall rules.

## Rules table

Features:

- Search and column filters
- Group sections with expand/collapse
- Drag-and-drop reorder (order matters for UFW)
- Row colors by [sync state](../concepts/ufw-rules-and-states.md)
- Add row, edit inline, delete row

## Refresh from server

Click **Refresh** (or use dashboard refresh) to:

1. Detect UFW state
2. Load snapshot from server
3. Sync draft origin states

Use this after manual changes on the server CLI or after a partial apply.

## Force resync

If the UI warns about drift or partial apply, use **Force resync from server** to replace local draft alignment with the actual remote snapshot before editing further.

## Import rules

Toolbar → import CSV, XLSX, or JSON. Validate imported rows in the table before apply preview.

## Apply workflow

1. Make draft edits
2. **Apply preview** — review planned commands and diff summary
3. **Confirm** — executes over SSH (rejected if remote UFW changed since preview — run preview again)
4. Watch the operation banner for progress

See [Draft and apply workflow](../concepts/draft-apply-workflow.md) for details.

## Safety tips

- Always keep at least one rule allowing SSH from your admin network before applying deny rules
- Run preview on production during a maintenance window
- Check **Operations history** after apply for SUCCESS or FAILED status

## Related docs

- [UFW rules and states](../concepts/ufw-rules-and-states.md)
- [Operations history](./operations-history.md)
