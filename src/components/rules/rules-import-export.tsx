"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadRulesExport } from "@/lib/exports/rules-export";
import type { UnifiedRuleRow } from "@/types/rule";
import { importRulesAction } from "@/server/actions/rules";

type RulesImportExportProps = {
  serverId: string;
  rows: UnifiedRuleRow[];
  resolveAllRows?: () => Promise<UnifiedRuleRow[]>;
  onImportSuccess?: () => void | Promise<void>;
  onStatusChange?: (status: { error: string | null; notice: string | null }) => void;
};

export function RulesImportExport({
  serverId,
  rows,
  resolveAllRows,
  onImportSuccess,
  onStatusChange,
}: RulesImportExportProps) {
  const t = useTranslations("rules.toolbar");
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport(file: File) {
    setLoading(true);
    onStatusChange?.({ error: null, notice: null });

    const formData = new FormData();
    formData.append("file", file);
    const result = await importRulesAction(serverId, formData);
    setLoading(false);

    if (!result.success) {
      onStatusChange?.({ error: result.error, notice: null });
      return;
    }

    await onImportSuccess?.();
    const notices: string[] = [];
    if (result.duplicateCount > 0) {
      notices.push(t("importDuplicatesSkipped", { count: result.duplicateCount }));
    }
    if (result.overlapCount > 0) {
      notices.push(t("importAddressOverlapDetected", { count: result.overlapCount }));
    }
    onStatusChange?.({
      error: null,
      notice: notices.length > 0 ? notices.join(" ") : null,
    });
  }

  async function handleExport() {
    onStatusChange?.({ error: null, notice: null });
    const exportRows = resolveAllRows ? await resolveAllRows() : rows;
    void downloadRulesExport(exportRows);
  }

  return (
    <>
      <Input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImport(file);
          }
          event.target.value = "";
        }}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading}>
        {t("import")}
      </Button>
      <Button variant="secondary" onClick={() => void handleExport()} disabled={loading}>
        {t("export")}
      </Button>
    </>
  );
}
