"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { DockerContainerDrawer } from "@/components/servers/docker-container-drawer";
import { DockerContainersTable } from "@/components/servers/docker-containers-table";
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
  getDockerInventoryByIdAction,
  refreshDockerInventoryAction,
} from "@/server/actions/docker-monitor";

type DockerMonitorPanelProps = {
  serverId: string;
  cachedSnapshotId?: string | null;
  onSnapshotId?: (snapshotId: string) => void;
};

export function DockerMonitorPanel({
  serverId,
  cachedSnapshotId = null,
  onSnapshotId,
}: DockerMonitorPanelProps) {
  const t = useTranslations("dockerMonitor");
  const [inventory, setInventory] = useState<DockerInventoryView | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspect, setInspect] = useState<DockerInspectView | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [loadingActionRef, setLoadingActionRef] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<DockerContainerAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<DockerContainerAction | null>(null);
  const [confirmContainer, setConfirmContainer] = useState<DockerContainerView | null>(null);

  const refreshById = useCallback(async (id: string) => {
    const latest = await getDockerInventoryByIdAction(id);
    if (latest) {
      setInventory(latest);
    }
    return latest;
  }, []);

  const startRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    setInventory(null);
    setSnapshotId(null);

    const result = await refreshDockerInventoryAction(serverId);
    setRefreshing(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSnapshotId(result.snapshotId);
    onSnapshotId?.(result.snapshotId);
    if (!result.reused) {
      notifyOperationStarted(serverId);
    }
    await refreshById(result.snapshotId);
  }, [onSnapshotId, refreshById, serverId]);

  const loadCachedSnapshot = useCallback(
    async (id: string) => {
      setError(null);
      setSnapshotId(id);
      await refreshById(id);
    },
    [refreshById],
  );

  useEffect(() => {
    if (cachedSnapshotId) {
      void loadCachedSnapshot(cachedSnapshotId);
      return;
    }

    void startRefresh();
    // Remount via key; avoid re-running when callback identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!snapshotId) {
      return;
    }

    if (
      inventory &&
      inventory.status !== "PENDING" &&
      inventory.status !== "RUNNING"
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshById(snapshotId);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [inventory, refreshById, snapshotId]);

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
    onSnapshotId?.(result.followUpSnapshotId);
    setSnapshotId(result.followUpSnapshotId);
    await refreshById(result.followUpSnapshotId);
  }

  function requestConfirm(container: DockerContainerView, action: DockerContainerAction) {
    setConfirmContainer(container);
    setConfirmAction(action);
  }

  return (
    <div className="space-y-4">
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

      {refreshing ? <p className="text-sm text-muted-foreground">{t("refreshing")}</p> : null}
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
