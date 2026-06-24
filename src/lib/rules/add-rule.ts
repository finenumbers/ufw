import { generateId } from "@/lib/utils";
import type { UnifiedRuleRow } from "@/types/rule";

export function appendEmptyRule(rows: UnifiedRuleRow[]): UnifiedRuleRow[] {
  return [
    ...rows,
    {
      clientRowId: generateId(),
      fingerprint: "",
      sortOrder: rows.length,
      core: {
        action: "ALLOW",
        direction: "IN",
        interface: null,
        protocol: null,
        fromAddress: null,
        fromPort: null,
        toAddress: "any",
        toPort: null,
        appName: null,
        logMode: "NONE",
        ruleComment: null,
        ipv6: false,
      },
      ui: { group: null, name: null, notes: null },
      originState: "DRAFT_ONLY",
      sources: { remote: false, local: false, draft: true },
      isPendingSave: true,
    },
  ];
}
