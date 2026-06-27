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
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
import { appendEmptyRule } from "@/lib/rules/add-rule";
import { cn } from "@/lib/utils";
import type { UnifiedRuleRow } from "@/types/rule";
import type { UfwDetectionResult } from "@/types/ufw";
import { previewApplyAction } from "@/server/actions/apply";
import { installUfwAction, loadUfwStateAction } from "@/server/actions/servers";

const dashboardActionButtonClass = "w-[160px] shrink-0";

type UfwDashboardProps = {
  serverId: string;
  initialState: UfwDetectionResult;
  dbRulesCount: number;
  portFindingCount: number;
  containerCount: number;
  rows: UnifiedRuleRow[];
  onRowsChange: (rows: UnifiedRuleRow[]) => void;
  resolveAllRows: () => Promise<UnifiedRuleRow[]>;
  onRulesRefresh: () => Promise<void>;
  portScanEnabled: boolean;
  dockerMonitorEnabled: boolean;
  onPortScanClick: () => void;
  onDockerRefreshClick: () => void;
};

export function UfwDashboard({
  serverId,
  initialState,
  dbRulesCount: initialDbRulesCount,
  portFindingCount: initialPortFindingCount,
  containerCount: initialContainerCount,
  rows,
  onRowsChange,
  resolveAllRows,
  onRulesRefresh,
  portScanEnabled,
  dockerMonitorEnabled,
  onPortScanClick,
  onDockerRefreshClick,
}: UfwDashboardProps) {
  const router = useRouter();
  const t = useTranslations("ufw");
  const tRules = useTranslations("rules.toolbar");
  const tPortScan = useTranslations("portScan");
  const tDocker = useTranslations("dockerMonitor");
  const tc = useTranslations("common");
  const [state, setState] = useState(initialState);
  const [dbRulesCount, setDbRulesCount] = useState(initialDbRulesCount);
  const [portFindingCount, setPortFindingCount] = useState(initialPortFindingCount);
  const [containerCount, setContainerCount] = useState(initialContainerCount);
  const [loading, setLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [sshReachable, setSshReachable] = useState<boolean | null>(null);
  const {
    message: operationError,
    showFailure: showOperationFailure,
    setMessage: setOperationError,
    clearMessage: clearOperationError,
  } = useActionFailureState();
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
    setPortFindingCount(initialPortFindingCount);
    setContainerCount(initialContainerCount);
  }, [initialState, initialDbRulesCount, initialPortFindingCount, initialContainerCount]);

  async function refresh() {
    setLoading(true);
    clearOperationError();
    notifyOperationStarted(serverId);

    const result = await loadUfwStateAction(serverId);
    setStatusChecked(true);

    if (!result.success) {
      setSshReachable(false);
      showOperationFailure(result, tc);
      setLoading(false);
      return;
    }

    setSshReachable(true);
    setState(result.state);
    await onRulesRefresh();
    router.refresh();
    setLoading(false);
  }

  async function handlePreviewApply() {
    setLoading(true);
    setSaveError(null);
    try {
      const allRows = await resolveAllRows();
      const result = await previewApplyAction(serverId, allRows);
      if (!result.success) {
        setSaveError(result.error);
        return;
      }
      setPreviewSessionId(result.data.sessionId);
      setPreviewSummary(result.data.plan.summary);
      setPreviewOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setSaveError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddRule() {
    onRowsChange(appendEmptyRule(rows));
  }

  async function handleInstall() {
    setLoading(true);
    clearOperationError();
    notifyOperationStarted(serverId);
    const result = await installUfwAction(serverId);
    if (result.success) {
      const refreshResult = await loadUfwStateAction(serverId);
      setStatusChecked(true);
      if (!refreshResult.success) {
        setSshReachable(false);
        showOperationFailure(refreshResult, tc);
      } else {
        setSshReachable(true);
        setState(refreshResult.state);
        await onRulesRefresh();
        router.refresh();
      }
    } else {
      setOperationError(result.message);
    }
    setLoading(false);
  }

  const installEnabled = statusChecked && sshReachable === true && !state.installed;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="flex w-[160px] shrink-0 flex-col gap-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {t("refreshStatus")}
            </Button>
            {statusChecked && sshReachable ? (
              <div
                className={cn(
                  "w-full rounded-md py-1 text-center text-xs font-semibold",
                  state.active ? "bg-green-600 text-white" : "bg-red-600 text-white",
                )}
              >
                {state.active ? t("active") : t("inactive")}
              </div>
            ) : null}
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
                onClick={() => void handlePreviewApply()}
                disabled={loading}
              >
                {tRules("saveRules")}
              </Button>
            </>
          ) : null}
          {!state.installed ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className={cn(
                    dashboardActionButtonClass,
                    "border-yellow-400 bg-yellow-300 text-yellow-950 hover:bg-yellow-400 hover:text-yellow-950",
                  )}
                  disabled={loading || !installEnabled}
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
                  <AlertDialogAction onClick={() => void handleInstall()}>
                    {t("confirmInstall")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {portScanEnabled || dockerMonitorEnabled ? (
          <div className="ml-auto flex flex-wrap gap-2">
            {portScanEnabled ? (
              <div className="flex w-[160px] shrink-0 flex-col gap-1">
                <Button className="w-full" onClick={onPortScanClick} disabled={loading}>
                  {tPortScan("scanButton")}
                </Button>
                <div
                  className={cn(
                    "w-full rounded-md py-1 text-center text-xs font-semibold",
                    portFindingCount > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white",
                  )}
                >
                  {tPortScan("portCount", { count: portFindingCount })}
                </div>
              </div>
            ) : null}
            {dockerMonitorEnabled ? (
              <div className="flex w-[160px] shrink-0 flex-col gap-1">
                <Button className="w-full" onClick={onDockerRefreshClick} disabled={loading}>
                  {tDocker("refreshButton")}
                </Button>
                <div
                  className={cn(
                    "w-full rounded-md py-1 text-center text-xs font-semibold",
                    containerCount > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white",
                  )}
                >
                  {tDocker("containerCount", { count: containerCount })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!statusChecked ? (
        <p className="text-sm text-muted-foreground">{t("refreshStatusHint")}</p>
      ) : null}
      {statusChecked && sshReachable === false ? (
        <p className="text-sm text-destructive">{t("sshUnavailable")}</p>
      ) : null}
      {statusChecked && sshReachable && !state.installed ? (
        <p className="text-sm text-muted-foreground">{t("ufwNotInstalled")}</p>
      ) : null}

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
