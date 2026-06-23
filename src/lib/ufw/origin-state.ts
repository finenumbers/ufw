import type { RuleOriginState } from "@prisma/client";

import type { UnifiedRuleRow } from "@/types/rule";

export function resolveRuleOriginState(
  fingerprint: string,
  remoteFingerprints: Set<string>,
  localFingerprints: Set<string>,
): RuleOriginState {
  const onRemote = remoteFingerprints.has(fingerprint);
  const onLocal = localFingerprints.has(fingerprint);

  if (onRemote && onLocal) return "MATCHED";
  if (onRemote) return "REMOTE_ONLY";
  if (onLocal) return "LOCAL_ONLY";
  return "DRAFT_ONLY";
}

export function originStateToSources(originState: RuleOriginState): UnifiedRuleRow["sources"] {
  return {
    remote: originState === "MATCHED" || originState === "REMOTE_ONLY",
    local: originState === "MATCHED" || originState === "LOCAL_ONLY",
    draft: originState === "DRAFT_ONLY",
  };
}
