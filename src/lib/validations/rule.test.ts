import assert from "node:assert/strict";
import test from "node:test";

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
