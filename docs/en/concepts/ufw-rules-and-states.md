# UFW rules and states

The rules table shows a **unified view**: remote UFW rules, local metadata, and your draft edits. Row **colors** reflect how each row relates to the server and the database.

## Rule structure

Each row has:

| Layer | Fields |
|-------|--------|
| **Core** | action, direction, protocol, addresses, ports, interface, app profile, log mode, comment, IPv6 |
| **UI metadata** | group, name, notes (stored locally, not sent to UFW unless in comment) |
| **Origin** | sync state driving row color |

Fingerprints identify rules across remote reloads and local edits.

## Origin states

| State | Color meaning | Typical situation |
|-------|---------------|-------------------|
| **MATCHED** | Remote and local metadata agree | Stable synced rule |
| **REMOTE_ONLY** | On server, not in local metadata | New remote rule after refresh |
| **LOCAL_ONLY** | In local DB, not on server | Pending add or removed remotely |
| **DRAFT_ONLY** | Draft edit not yet applied | New row or changed core fields |
| **CONFLICT** | Same fingerprint, different core fields | Drift — review before apply |
| **DELETED** | Marked deleted in draft | Will be removed on apply |

Colors help spot drift **before** applying. After **Force resync from server**, the draft realigns to the remote snapshot.

## Address overlap highlight

Some rules can match the same traffic even when their fingerprints differ — for example `95.163.183.223` inside `95.163.183.192/26`, or a wider `/24` covering an existing `/26`.

Rows involved in at least one such overlap are highlighted **violet** in the rules table. This color takes precedence over the green/yellow/red origin colors. Both rows in an overlapping pair are highlighted.

The legend above the table includes a violet swatch: **Overlapping IP or CIDR ranges**.

Overlap is computed from the current draft (same direction, same IP family, non-`anywhere` addresses). It is a **warning only** — import and apply are not blocked. Remove or adjust addresses until the violet highlight disappears.

Typical after import: a new host or CIDR overlaps an existing rule on the server. Review order carefully — UFW uses the first matching rule.

## Two rule counts

The UI shows different counts in different places:

| Location | Label | Counts |
|----------|-------|--------|
| **Servers list** card | saved rules | Rows in `ruleRecord` (local metadata) |
| **Dashboard** badge | in table | Rows in active draft session table |

These differ while you edit, import, or sync. The dashboard badge matches the visible table length.

## Order matters

UFW evaluates rules in order. The table supports drag-and-drop reorder. Apply may emit order-resync operations when remote numbering diverges from your draft order.

## Remote vs local metadata

- **Remote core fields** come from parsed `ufw status numbered` output
- **Group, name, notes** exist only in UFW Remote Manager unless copied into UFW rule comments
- Apply writes core fields to the server; UI metadata stays in Postgres

## Related docs

- [Draft and apply workflow](./draft-apply-workflow.md)
- [Edit and apply rules](../user-guide/edit-and-apply-rules.md)
