import type { UnifiedRuleRow } from "@/types/rule";

import {
  buildRulesExportFilename,
  exportRulesToXlsxBuffer,
} from "@/lib/exports/rules-export.helpers";

export function downloadRulesExport(rows: UnifiedRuleRow[], filename?: string): void {
  const content = exportRulesToXlsxBuffer(rows);
  const blob = new Blob([content], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? buildRulesExportFilename();
  anchor.click();
  URL.revokeObjectURL(url);
}
