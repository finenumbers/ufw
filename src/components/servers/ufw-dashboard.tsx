"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ApplyPreviewDialog } from "@/components/rules/apply-preview-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { notifyOperationStarted } from "@/lib/operations/events";
import { appendEmptyRule } from "@/lib/rules/add-rule";
import { cn } from "@/lib/utils";
import type { UnifiedRuleRow } from "@/types/rule";
import type { UfwDetectionResult } from "@/types/ufw";
import { previewApplyAction } from "@/server/actions/apply";
import {
  installUfwAction,
  loadUfwStateAction,
  testServerConnectionAction,
} from "@/server/actions/servers";

const dashboardActionButtonClass = "w-[160px] shrink-0";

type UfwDashboardProps = {
  serverId: string;
  initialState: UfwDetectionResult;
  dbRulesCount: number;
  rows: UnifiedRuleRow[];
  onRowsChange: (rows: UnifiedRuleRow[]) => void;
  resolveAllRows: () => Promise<UnifiedRuleRow[]>;
  onRulesRefresh: () => Promise<void>;
};

export function UfwDashboard({
  serverId,
  initialState,
  dbRulesCount: initialDbRulesCount,
  rows,
  onRowsChange,
  resolveAllRows,
  onRulesRefresh,
}: UfwDashboardProps) {
  const router = useRouter();
  const t = useTranslations("ufw");
  const tRules = useTranslations("rules.toolbar");
  const tc = useTranslations("common");
  const [state, setState] = useState(initialState);
  const [dbRulesCount, setDbRulesCount] = useState(initialDbRulesCount);
  const [loading, setLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<{
    addCount: number;
    removeCount: number;
    updateCount: number;
    dbSync?: boolean;
  } | null>(null);

  useEffect(() => {
    setState(initialState);
    setDbRulesCount(initialDbRulesCount);
  }, [initialState, initialDbRulesCount]);

  async function refresh() {
    setLoading(true);
    notifyOperationStarted(serverId);
    const next = await loadUfwStateAction(serverId);
    setState(next);
    await onRulesRefresh();
    router.refresh();
    setLoading(false);
  }

  async function handleTestSsh() {
    setLoading(true);
    notifyOperationStarted(serverId);
    await testServerConnectionAction(serverId);
    setLoading(false);
  }

  async function handlePreviewApply() {
    setLoading(true);
    setSaveError(null);
    const allRows = await resolveAllRows();
    const result = await previewApplyAction(serverId, allRows);
    setLoading(false);
    if (!result.success) {
      setSaveError(result.error);
      return;
    }
    setPreviewSessionId(result.data.sessionId);
    setPreviewSummary(result.data.plan.summary);
    setPreviewOpen(true);
  }

  function handleAddRule() {
    onRowsChange(appendEmptyRule(rows));
  }

  async function handleInstall() {
    setLoading(true);
    setOperationError(null);
    notifyOperationStarted(serverId);
    const result = await installUfwAction(serverId);
    if (result.success) {
      const next = await loadUfwStateAction(serverId);
      setState(next);
      await onRulesRefresh();
      router.refresh();
    } else {
      setOperationError(result.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex w-[160px] shrink-0 flex-col gap-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleTestSsh}
            disabled={loading}
          >
            {t("testSsh")}
          </Button>
          <div
            className={cn(
              "w-full rounded-md py-1 text-center text-xs font-semibold",
              state.installed ? "bg-green-600 text-white" : "bg-red-600 text-white",
            )}
          >
            {state.installed ? t("installed") : t("notInstalled")}
          </div>
        </div>
        <div className="flex w-[160px] shrink-0 flex-col gap-1">
          <Button
            variant="outline"
            className="w-full"
            onClick={refresh}
            disabled={loading}
          >
            {t("refreshStatus")}
          </Button>
          <div
            className={cn(
              "w-full rounded-md py-1 text-center text-xs font-semibold",
              state.active ? "bg-green-600 text-white" : "bg-red-600 text-white",
            )}
          >
            {state.active ? t("active") : t("inactive")}
          </div>
        </div>
        {state.installed && state.active ? (
          <>
            <div className="flex w-[160px] shrink-0 flex-col gap-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddRule}
                disabled={loading}
              >
                {tRules("addRule")}
              </Button>
              <div
                className={cn(
                  "w-full rounded-md py-1 text-center text-xs font-semibold",
                  dbRulesCount > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white",
                )}
              >
                {t("dbRules", { count: dbRulesCount })}
              </div>
            </div>
            <Button
              className={dashboardActionButtonClass}
              onClick={handlePreviewApply}
              disabled={loading}
            >
              {tRules("saveRules")}
            </Button>
          </>
        ) : null}
        {!state.installed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className={cn(
                  dashboardActionButtonClass,
                  "border-yellow-400 bg-yellow-300 text-yellow-950 hover:bg-yellow-400 hover:text-yellow-950",
                )}
                disabled={loading}
              >
                {t("installUfw")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("installTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("installDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleInstall}>{t("confirmInstall")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {operationError ? <p className="text-sm text-destructive">{operationError}</p> : null}
      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
      <ApplyPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sessionId={previewSessionId}
        serverId={serverId}
        summary={previewSummary}
        onCompleted={async () => {
          await onRulesRefresh();
          router.refresh();
        }}
      />
    </div>
  );
}
