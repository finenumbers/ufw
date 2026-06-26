"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { DockerContainerDrawer } from "@/components/servers/docker-container-drawer";
import { DockerContainersTable } from "@/components/servers/docker-containers-table";
import { Button } from "@/components/ui/button";
import { notifyOperationStarted } from "@/lib/operations/events";
import type {
  DockerContainerAction,
  DockerContainerView,
  DockerInspectView,
  DockerInventoryView,
} from "@/types/docker-monitor";
import {
  controlDockerContainerAction,
  getDockerContainerInspectAction,
  getLatestDockerInventoryAction,
  refreshDockerInventoryAction,
} from "@/server/actions/docker-monitor";

type DockerMonitorPanelProps = {
  serverId: string;
  initialInventory: DockerInventoryView | null;
  enabled: boolean;
};

export function DockerMonitorPanel({
  serverId,
  initialInventory,
  enabled,
}: DockerMonitorPanelProps) {
  const t = useTranslations("dockerMonitor");
  const [inventory, setInventory] = useState<DockerInventoryView | null>(initialInventory);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspect, setInspect] = useState<DockerInspectView | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [loadingActionRef, setLoadingActionRef] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<DockerContainerAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<DockerContainerAction | null>(null);
  const [confirmContainer, setConfirmContainer] = useState<DockerContainerView | null>(null);

  const refresh = useCallback(async () => {
    const latest = await getLatestDockerInventoryAction(serverId);
    setInventory(latest);
  }, [serverId]);

  useEffect(() => {
    function handleOperationStarted(event: Event) {
      const detail = (event as CustomEvent<{ serverId?: string }>).detail;
      if (detail?.serverId === serverId) {
        void refresh();
      }
    }

    window.addEventListener("operation-started", handleOperationStarted);
    return () => window.removeEventListener("operation-started", handleOperationStarted);
  }, [refresh, serverId]);

  useEffect(() => {
    if (!inventory || inventory.status !== "PENDING") {
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [inventory, refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    const result = await refreshDockerInventoryAction(serverId);
    setRefreshing(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    notifyOperationStarted(serverId);
    await refresh();
  }

  async function handleDetails(container: DockerContainerView) {
    setDrawerOpen(true);
    setInspectLoading(true);
    setInspect(null);

    const detail = await getDockerContainerInspectAction(serverId, container.containerId);
    setInspect(detail);
    setInspectLoading(false);
  }

  async function runControl(container: DockerContainerView, action: DockerContainerAction) {
    setLoadingActionRef(container.containerId);
    setPendingAction(action);
    setError(null);

    const result = await controlDockerContainerAction(
      serverId,
      container.containerId,
      container.name,
      action,
    );

    setLoadingActionRef(null);
    setPendingAction(null);
    setConfirmAction(null);
    setConfirmContainer(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    notifyOperationStarted(serverId);
    await refresh();
  }

  function requestConfirm(container: DockerContainerView, action: DockerContainerAction) {
    setConfirmContainer(container);
    setConfirmAction(action);
  }

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t("disabled")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          {inventory?.dockerVersion ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("meta", {
                version: inventory.dockerVersion,
                compose: inventory.composeVersion ?? "—",
              })}
            </p>
          ) : null}
        </div>
        <Button onClick={() => void handleRefresh()} disabled={refreshing}>
          {refreshing ? t("refreshing") : t("refreshButton")}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {inventory?.capturedAt ? (
        <p className="text-xs text-muted-foreground">
          {t("lastRefreshAt", { date: new Date(inventory.capturedAt).toLocaleString() })}
        </p>
      ) : null}

      {inventory?.summary ? (
        <p className="text-sm text-muted-foreground">
          {t("summary", {
            total: inventory.summary.containerCount,
            running: inventory.summary.runningCount,
            stopped: inventory.summary.stoppedCount,
          })}
        </p>
      ) : null}

      {inventory?.errorMessage && inventory.status === "FAILED" ? (
        <p className="text-sm text-destructive">{inventory.errorMessage}</p>
      ) : null}

      <DockerContainersTable
        containers={inventory?.containers ?? []}
        loadingActionRef={loadingActionRef}
        pendingAction={pendingAction}
        confirmAction={confirmAction}
        confirmContainerRef={confirmContainer?.containerId ?? null}
        onDetails={(container) => void handleDetails(container)}
        onStart={(container) => void runControl(container, "START")}
        onStop={(container) => requestConfirm(container, "STOP")}
        onRestart={(container) => requestConfirm(container, "RESTART")}
        onConfirm={() => {
          if (confirmContainer && confirmAction) {
            void runControl(confirmContainer, confirmAction);
          }
        }}
        onCancelConfirm={() => {
          setConfirmAction(null);
          setConfirmContainer(null);
        }}
      />

      <DockerContainerDrawer
        open={drawerOpen}
        inspect={inspect}
        loading={inspectLoading}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
