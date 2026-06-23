import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";

import {
  buildRulesExportFilename,
  exportRulesToXlsxBuffer,
  unifiedRowToImportRow,
  unifiedRowsToImportRows,
} from "@/lib/exports/rules-export";
import { parseXlsxRules } from "@/lib/imports/xlsx";
import { RULES_FILE_COLUMNS } from "@/lib/rules/file-columns";
import type { UnifiedRuleRow } from "@/types/rule";

function sampleRow(overrides: Partial<UnifiedRuleRow> = {}): UnifiedRuleRow {
  return {
    clientRowId: "row-1",
    fingerprint: "fp-1",
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
      group: "SSH",
      name: "Allow SSH",
      notes: "note",
    },
    originState: "MATCHED",
    sources: { remote: true, local: true, draft: false },
    ...overrides,
  };
}

test("unifiedRowToImportRow maps core and ui fields", () => {
  const row = sampleRow();
  assert.deepEqual(unifiedRowToImportRow(row), {
    action: "ALLOW",
    direction: "IN",
    protocol: "TCP",
    fromAddress: "any",
    toAddress: "any",
    toPort: "22",
    logMode: "NONE",
    ipv6: false,
    group: "SSH",
    name: "Allow SSH",
    notes: "note",
  });
});

test("unifiedRowsToImportRows skips deleted rows and preserves order", () => {
  const rows = [
    sampleRow({ clientRowId: "b", sortOrder: 1, ui: { name: "Second" } }),
    sampleRow({ clientRowId: "a", sortOrder: 0, ui: { name: "First" } }),
    sampleRow({ clientRowId: "c", sortOrder: 2, isDeleted: true }),
  ];

  const exported = unifiedRowsToImportRows(rows);
  assert.equal(exported.length, 2);
  assert.equal(exported[0]?.name, "First");
  assert.equal(exported[1]?.name, "Second");
});

test("exportRulesToXlsxBuffer uses table column order", () => {
  const buffer = exportRulesToXlsxBuffer([sampleRow()]);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0];

  assert.deepEqual(headerRow, [...RULES_FILE_COLUMNS]);
});

test("exportRulesToXlsxBuffer produces import-compatible workbook", () => {
  const buffer = exportRulesToXlsxBuffer([
    sampleRow({
      core: {
        action: "ALLOW",
        direction: "IN",
        interface: "eth0",
        protocol: "TCP",
        fromAddress: "any",
        fromPort: null,
        toAddress: "any",
        toPort: "443",
        appName: "Nginx Full",
        logMode: "LOG",
        ruleComment: "web server",
        ipv6: false,
      },
      ui: {
        group: "Web",
        name: "HTTPS",
        notes: "production",
      },
    }),
  ]);
  const imported = parseXlsxRules(buffer);

  assert.equal(imported.length, 1);
  assert.equal(imported[0]?.action, "ALLOW");
  assert.equal(imported[0]?.direction, "IN");
  assert.equal(imported[0]?.interface, "eth0");
  assert.equal(imported[0]?.toPort, "443");
  assert.equal(imported[0]?.protocol, "TCP");
  assert.equal(imported[0]?.logMode, "LOG");
  assert.equal(imported[0]?.ipv6, false);
  assert.equal(imported[0]?.appName, "Nginx Full");
  assert.equal(imported[0]?.ruleComment, "web server");
  assert.equal(imported[0]?.group, "Web");
  assert.equal(imported[0]?.name, "HTTPS");
  assert.equal(imported[0]?.notes, "production");
});

test("buildRulesExportFilename uses ISO date", () => {
  assert.equal(
    buildRulesExportFilename(new Date("2026-06-23T12:00:00.000Z")),
    "ufw-rules-2026-06-23.xlsx",
  );
});
