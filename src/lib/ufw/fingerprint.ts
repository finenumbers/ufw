import { createHash } from "crypto";

import { toCanonicalCore } from "@/lib/ufw/types";
import type { RuleCore } from "@/types/rule";

export function computeFingerprint(core: RuleCore): string {
  const canonical = toCanonicalCore(core);
  const payload = JSON.stringify(canonical, Object.keys(canonical).sort());
  return createHash("sha256").update(payload).digest("hex");
}
