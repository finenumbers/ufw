import assert from "node:assert/strict";
import test from "node:test";

import {
  collectDistinctGroups,
  collectDistinctNames,
  filterRowsByColumnHeaders,
} from "@/lib/rules/column-filters";
import type { UnifiedRuleRow } from "@/types/rule";

function row(partial: {
  group?: string | null;
  name?: string | null;
  clientRowId?: string;
}): UnifiedRuleRow {
  return {
    clientRowId: partial.clientRowId ?? "1",
    fingerprint: partial.clientRowId ?? "1",
    sortOrder: 0,
    core: {
      action: "ALLOW",
      direction: "IN",
      interface: null,
      protocol: "TCP",
      fromAddress: "any",
      fromPort: null,
      toAddress: "any",
      toPort: "22",
      appName: null,
      logMode: "NONE",
      ruleComment: null,
      ipv6: false,
    },
    ui: {
      group: partial.group ?? null,
      name: partial.name ?? null,
      notes: null,
    },
    originState: "MATCHED",
    sources: { remote: true, local: true, draft: false },
  };
}

test("collectDistinctNames respects active group filter", () => {
  const rows = [
    row({ clientRowId: "a", group: "Web", name: "HTTP" }),
    row({ clientRowId: "b", group: "Web", name: "HTTPS" }),
    row({ clientRowId: "c", group: "DB", name: "Postgres" }),
  ];

  assert.deepEqual(collectDistinctNames(rows, "Web"), ["HTTP", "HTTPS"]);
});

test("collectDistinctGroups respects active name filter", () => {
  const rows = [
    row({ clientRowId: "a", group: "Web", name: "HTTP" }),
    row({ clientRowId: "b", group: "DB", name: "Postgres" }),
  ];

  assert.deepEqual(collectDistinctGroups(rows, "Postgres"), ["DB"]);

  const rowsName11EmptyGroup = [
    row({ clientRowId: "c", group: "", name: "11" }),
    row({ clientRowId: "d", group: null, name: "11" }),
  ];
  assert.deepEqual(collectDistinctGroups(rowsName11EmptyGroup, "11"), []);

  const rowsName11Mixed = [
    row({ clientRowId: "e", group: "й", name: "11" }),
    row({ clientRowId: "f", group: "", name: "11" }),
  ];
  assert.deepEqual(collectDistinctGroups(rowsName11Mixed, "11"), ["й"]);
});

test("filterRowsByColumnHeaders applies both filters", () => {
  const rows = [
    row({ clientRowId: "a", group: "Web", name: "HTTP" }),
    row({ clientRowId: "b", group: "Web", name: "HTTPS" }),
    row({ clientRowId: "c", group: "DB", name: "Postgres" }),
  ];

  const filtered = filterRowsByColumnHeaders(rows, "Web", "HTTPS");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.clientRowId, "b");
});
