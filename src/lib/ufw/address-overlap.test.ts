import assert from "node:assert/strict";
import test from "node:test";

import { countOverlappingRows, findOverlappingRowIds } from "@/lib/ufw/address-overlap";
import type { UnifiedRuleRow } from "@/types/rule";

function sampleRow(
  clientRowId: string,
  overrides: Partial<UnifiedRuleRow> & { core?: Partial<UnifiedRuleRow["core"]> } = {},
): UnifiedRuleRow {
  return {
    clientRowId,
    fingerprint: clientRowId,
    sortOrder: 0,
    core: {
      action: "ALLOW",
      direction: "IN",
      interface: null,
      protocol: null,
      fromAddress: "10.0.0.1",
      fromPort: null,
      toAddress: "any",
      toPort: null,
      appName: null,
      logMode: "NONE",
      ruleComment: null,
      ipv6: false,
      ...overrides.core,
    },
    ui: { group: null, name: null, notes: null },
    originState: "DRAFT_ONLY",
    sources: { remote: false, local: false, draft: true },
    ...overrides,
  };
}

test("findOverlappingRowIds marks host inside CIDR", () => {
  const rows = [
    sampleRow("cidr", { core: { fromAddress: "95.163.183.192/26" } }),
    sampleRow("host", { core: { fromAddress: "95.163.183.223" } }),
  ];

  const overlapping = findOverlappingRowIds(rows);
  assert.equal(overlapping.size, 2);
  assert.equal(countOverlappingRows(rows), 2);
});

test("findOverlappingRowIds marks nested CIDR ranges", () => {
  const rows = [
    sampleRow("wide", { core: { fromAddress: "95.163.183.0/24" } }),
    sampleRow("narrow", { core: { fromAddress: "95.163.183.192/26" } }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 2);
});

test("findOverlappingRowIds ignores non-overlapping hosts", () => {
  const rows = [
    sampleRow("a", { core: { fromAddress: "10.0.0.1" } }),
    sampleRow("b", { core: { fromAddress: "10.0.0.2" } }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 0);
});

test("findOverlappingRowIds ignores different directions", () => {
  const rows = [
    sampleRow("in", { core: { direction: "IN", fromAddress: "10.0.0.1", toAddress: "any" } }),
    sampleRow("out", {
      core: { direction: "OUT", fromAddress: "any", toAddress: "10.0.0.1" },
    }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 0);
});

test("findOverlappingRowIds ignores anywhere addresses", () => {
  const rows = [
    sampleRow("any", { core: { fromAddress: "anywhere" } }),
    sampleRow("host", { core: { fromAddress: "10.0.0.1" } }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 0);
});

test("findOverlappingRowIds compares OUT destination addresses", () => {
  const rows = [
    sampleRow("out-a", {
      core: { direction: "OUT", fromAddress: "any", toAddress: "192.168.1.0/24" },
    }),
    sampleRow("out-b", {
      core: { direction: "OUT", fromAddress: "any", toAddress: "192.168.1.50" },
    }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 2);
});

test("findOverlappingRowIds ignores deleted rows", () => {
  const rows = [
    sampleRow("cidr", { core: { fromAddress: "95.163.183.192/26" } }),
    sampleRow("host", { core: { fromAddress: "95.163.183.223" }, isDeleted: true }),
  ];

  assert.equal(findOverlappingRowIds(rows).size, 0);
});
