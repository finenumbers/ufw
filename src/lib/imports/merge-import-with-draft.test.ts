import assert from "node:assert/strict";
import test from "node:test";

import { alignImportCoreWithRemote } from "@/lib/imports/align-import-core";
import { mergeImportWithDraftRows } from "@/lib/imports/merge-import-with-draft";
import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { parseNumberedRules } from "@/lib/ufw/parser";
import type { ImportRuleRow } from "@/lib/validations/import";
import type { UnifiedRuleRow } from "@/types/rule";

test("alignImportCoreWithRemote defaults direction and toAddress like remote parser", () => {
  const core = alignImportCoreWithRemote({
    action: "ALLOW",
    fromAddress: "90.189.217.68",
  });

  assert.equal(core.direction, "IN");
  assert.equal(core.fromAddress, "90.189.217.68");
  assert.equal(core.toAddress, "any");
});

test("import fingerprint matches remote parser for typical allow rule", () => {
  const status = `
To                         Action      From
--                         ------      ----
Anywhere                   ALLOW       90.189.217.68
`;
  const remote = parseNumberedRules(status)[0];
  assert.ok(remote);

  const imported = alignImportCoreWithRemote({
    action: "ALLOW",
    fromAddress: "90.189.217.68",
  });

  assert.equal(computeFingerprint(imported), remote.fingerprint);
});

test("mergeImportWithDraftRows merges metadata instead of duplicating remote rows", () => {
  const status = `
To                         Action      From
--                         ------      ----
Anywhere                   ALLOW       90.189.217.68
`;
  const remote = parseNumberedRules(status)[0];
  assert.ok(remote);

  const existingRows: UnifiedRuleRow[] = [
    {
      clientRowId: "existing-1",
      fingerprint: remote.fingerprint,
      sortOrder: 0,
      core: remote.core,
      ui: { group: null, name: null, notes: null },
      originState: "REMOTE_ONLY",
      sources: { remote: true, local: false, draft: true },
    },
  ];

  const imported: ImportRuleRow[] = [
    {
      action: "ALLOW",
      fromAddress: "90.189.217.68",
      group: "Access",
      name: "House",
    },
    {
      action: "ALLOW",
      fromAddress: "10.0.0.0/8",
      group: "Access",
      name: "Intranet",
    },
  ];

  const result = mergeImportWithDraftRows(existingRows, imported);

  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0]?.clientRowId, "existing-1");
  assert.equal(result.rows[0]?.ui.group, "Access");
  assert.equal(result.rows[0]?.ui.name, "House");
  assert.equal(result.rows[1]?.ui.name, "Intranet");
  assert.equal(result.duplicateCount, 1);
});
