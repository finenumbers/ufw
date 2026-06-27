import assert from "node:assert/strict";
import test from "node:test";

import { computeFingerprint } from "@/lib/ufw/fingerprint";
import { parseUnifiedRuleRows } from "@/lib/validations/rule";

const validRow = {
  clientRowId: "row-1",
  fingerprint: "fp-1",
  core: {
    action: "ALLOW",
    direction: "IN",
    interface: null,
    protocol: "TCP",
    fromAddress: "any",
    fromPort: null,
    toAddress: "any",
    toPort: "443",
    appName: null,
    logMode: "NONE",
    ruleComment: null,
    ipv6: false,
  },
  ui: { group: null, name: "Web", notes: null },
  originState: "MATCHED",
  sources: { remote: true, local: true, draft: false },
  sortOrder: 0,
};

test("parseUnifiedRuleRows accepts valid rows", () => {
  const rows = parseUnifiedRuleRows([validRow]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.core.action, "ALLOW");
});

test("parseUnifiedRuleRows computes fingerprint for new draft rows", () => {
  const rows = parseUnifiedRuleRows([
    {
      ...validRow,
      clientRowId: "row-new",
      fingerprint: "",
      originState: "DRAFT_ONLY",
      sources: { remote: false, local: false, draft: true },
      isPendingSave: true,
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.fingerprint, computeFingerprint(validRow.core));
});

test("parseUnifiedRuleRows ignores tampered client fingerprint", () => {
  const rows = parseUnifiedRuleRows([
    {
      ...validRow,
      fingerprint: "tampered-fingerprint",
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.fingerprint, computeFingerprint(validRow.core));
  assert.notEqual(rows[0]?.fingerprint, "tampered-fingerprint");
});

test("parseUnifiedRuleRows rejects invalid action enum", () => {
  assert.throws(
    () =>
      parseUnifiedRuleRows([
        {
          ...validRow,
          core: { ...validRow.core, action: "ALLOW; id" },
        },
      ]),
    /Invalid rule data at 0\.core\.action/,
  );
});

test("parseUnifiedRuleRows rejects invalid logMode enum", () => {
  assert.throws(
    () =>
      parseUnifiedRuleRows([
        {
          ...validRow,
          core: { ...validRow.core, logMode: "LOG; id" },
        },
      ]),
    /Invalid rule data at 0\.core\.logMode/,
  );
});
