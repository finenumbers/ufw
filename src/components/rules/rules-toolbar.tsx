"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ApplyPreviewDialog } from "@/components/rules/apply-preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadRulesExport } from "@/lib/exports/rules-export";
import { generateId } from "@/lib/utils";
import type { UnifiedRuleRow } from "@/types/rule";
import { importRulesAction } from "@/server/actions/rules";
import { updateDraftRulesAction } from "@/server/actions/rules";
import { previewApplyAction } from "@/server/actions/apply";

type RulesToolbarProps = {
  serverId: string;
  rows: UnifiedRuleRow[];
  onRowsChange: (rows: UnifiedRuleRow[]) => void;
  onRefresh: () => Promise<void>;
};

export function RulesToolbar({ serverId, rows, onRowsChange, onRefresh }: RulesToolbarProps) {
  const t = useTranslations("rules.toolbar");
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<{ addCount: number; removeCount: number; updateCount: number } | null>(null);

  async function handleSaveDraft() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const result = await updateDraftRulesAction(serverId, rows);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(t("draftSaved"));
    await onRefresh();
  }

  async function handleImport(file: File) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await importRulesAction(serverId, formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onRowsChange(result.rows);
    if (result.duplicateCount > 0) {
      setNotice(t("importDuplicatesSkipped", { count: result.duplicateCount }));
    }
  }

  async function handlePreviewApply() {
    setLoading(true);
    setError(null);
    const result = await previewApplyAction(serverId, rows);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPreviewSessionId(result.data.sessionId);
    setPreviewSummary(result.data.plan.summary);
    setPreviewOpen(true);
  }

  function handleExport() {
    setError(null);
    downloadRulesExport(rows);
  }

  function handleAddRule() {
    const core = {
      action: "ALLOW" as const,
      direction: "IN" as const,
      interface: null,
      protocol: "TCP" as const,
      fromAddress: "any",
      fromPort: null,
      toAddress: "any",
      toPort: "22",
      appName: null,
      logMode: "NONE" as const,
      ruleComment: null,
      ipv6: false,
    };

    onRowsChange([
      ...rows,
      {
        clientRowId: generateId(),
        fingerprint: "",
        sortOrder: rows.length,
        core,
        ui: { group: "Custom", name: "New rule", notes: null },
        originState: "DRAFT_ONLY",
        sources: { remote: false, local: false, draft: true },
        isPendingSave: true,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleAddRule} variant="outline">
          {t("addRule")}
        </Button>
        <Button onClick={handleSaveDraft} disabled={loading} variant="outline">
          {t("saveDraft")}
        </Button>
        <Button onClick={handlePreviewApply} disabled={loading}>
          {t("saveRules")}
        </Button>
        <Input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
          }}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading}>
          {t("import")}
        </Button>
        <Button variant="secondary" onClick={handleExport} disabled={loading}>
          {t("export")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      <p className="text-xs text-muted-foreground">
        {t.rich("hint", {
          highlight: (chunks) => <span className="font-medium">{chunks}</span>,
        })}
      </p>
      <ApplyPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sessionId={previewSessionId}
        serverId={serverId}
        summary={previewSummary}
        onCompleted={async () => {
          await onRefresh();
        }}
      />
    </div>
  );
}
