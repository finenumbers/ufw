# UFW rules and states

Rules are normalized into a unified row model with **core** fields (what UFW cares about) and **UI** fields (name, group, color metadata).

## Rule core fields

Typical columns include action (allow/deny/reject), direction, protocol, ports, source/destination addresses, and logging mode. The exact set matches UFW’s expressive rule syntax — see the rules table in the UI.

## Sync states (row colors)

Each row has a **state** that shows how local draft data relates to the last server snapshot:

| State | Meaning |
|-------|---------|
| **MATCHED** | Draft matches what UFW reported on the server |
| **REMOTE_ONLY** | Exists on server snapshot but not in your local draft |
| **LOCAL_ONLY** | In your draft but not on the server (will be added on apply) |
| **DRAFT_ONLY** | Local edit not yet applied; differs from matched baseline |

Colors help you spot drift before applying. After **Force resync from server**, local draft realigns to remote state.

## Fingerprints

Each rule has a fingerprint derived from core fields. Used to match rows across snapshots and detect reorder/delete operations during apply planning.

## Grouping and ordering

- **Groups** — organize rules visually; group name is UI metadata
- **Order** — UFW rule order matters; reordering may require delete-and-recreate on the server during apply

## Import formats

Rules can be imported from **CSV**, **XLSX**, or **JSON** via the rules toolbar. Imported rows become draft entries — still require apply to reach the server.

## Related docs

- [Draft and apply workflow](./draft-apply-workflow.md)
- [Edit and apply rules](../user-guide/edit-and-apply-rules.md)
