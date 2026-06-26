import { normalizeAddress } from "@/lib/ufw/types";
import type { RuleCore } from "@/types/rule";
import type { ImportRuleRow } from "@/lib/validations/import";

/** Align imported row fields with remote UFW parser defaults so fingerprints match. */
export function alignImportCoreWithRemote(row: ImportRuleRow): RuleCore {
  const direction = row.direction ?? "IN";

  let fromAddress = row.fromAddress ?? null;
  let toAddress = row.toAddress ?? null;

  if (direction === "IN") {
    if (fromAddress && !toAddress) {
      toAddress = "anywhere";
    } else if (!fromAddress && toAddress) {
      fromAddress = "anywhere";
    } else if (!fromAddress && !toAddress) {
      fromAddress = "anywhere";
      toAddress = "anywhere";
    }
  }

  return {
    action: row.action,
    direction,
    interface: row.interface ?? null,
    protocol: row.protocol ?? null,
    fromAddress: fromAddress ? normalizeAddress(fromAddress) : normalizeAddress("anywhere"),
    fromPort: row.fromPort ?? null,
    toAddress: toAddress ? normalizeAddress(toAddress) : null,
    toPort: row.toPort ?? null,
    appName: row.appName ?? null,
    logMode: row.logMode ?? "NONE",
    ruleComment: row.ruleComment ?? null,
    ipv6: row.ipv6 ?? false,
  };
}
