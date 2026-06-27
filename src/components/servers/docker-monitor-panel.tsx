"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { DockerContainerDrawer } from "@/components/servers/docker-container-drawer";
import { DockerContainersTable } from "@/components/servers/docker-containers-table";
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
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
  getDockerInventoryStatusByIdAction,
  getLatestDockerInventoryForServerAction,
  refreshDockerInventoryAction,
} from "@/server/actions/docker-monitor";

type DockerMonitorPanelProps = {
  serverId: string;
  initialInventory?: DockerInventoryView | null;
  startToken?: number;
  onInventoryUpdated?: (inventory: DockerInventoryView) => void;
};

function pollDelayMs(attempt: number): number {
  if (attempt < 5) {
    return 3000;
  }
  if (attempt < 15) {
    return 5000;
  }
  return 10000;
}

export function DockerMonitorPanel({
  serverId,
  initialInventory = null,
  startToken = 0,
  onInventoryUpdated,
}: DockerMonitorPanelProps) {
  const t = useTranslations("dockerMonitor");
  const tCommon = useTranslations("common");
  const [inventory, setInventory] = useState<DockerInventoryView | null>(initialInventory);
  const [snapshotId, setSnapshotId] = useState<string | null>(initialInventory?.id ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const { message: error, showFailure, clearMessage } = useActionFailureState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inspect, setInspect] = useState<DockerInspectView | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [loadingActionRef, setLoadingActionRef] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<DockerContainerAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<DockerContainerAction | null>(null);
  const [confirmContainer, setConfirmContainer] = useState<DockerContainerView | null>(null);
  const pollAttemptRef = useRef(0);
  const loadedLatestRef = useRef(false);

  useEffect(() => {
    if (loadedLatestRef.current || initialInventory) {
      return;
    }

    loadedLatestRef.current = true;
    void getLatestDockerInventoryForServerAction(serverId).then((latest) => {
      if (latest) {
        setInventory(latest);
        setSnapshotId(latest.id);
        if (latest.status === "SUCCESS") {
          onInventoryUpdated?.(latest);
        }
      }
    });
  }, [initialInventory, onInventoryUpdated, serverId]);

  useEffect(() => {
    if (initialInventory == null) {
      return;
    }
    if (
      refreshing ||
      inventory?.status === "RUNNING" ||
      inventory?.status === "PENDING"
    ) {
      return;
    }
    setInventory(initialInventory);
    setSnapshotId(initialInventory.id);
  }, [initialInventory, refreshing, inventory?.status]);

  const notifyInventoryUpdate = useCallback(
    (next: DockerInventoryView) => {
      setInventory(next);
      if (next.status === "SUCCESS") {
        onInventoryUpdated?.(next);
      }
    },
    [onInventoryUpdated],
  );

  const pollInventory = useCallback(
    async (id: string) => {
      const status = await getDockerInventoryStatusByIdAction(id);
      if (!status) {
        return null;
      }

      if (status.status === "SUCCESS" || status.status === "FAILED") {
        pollAttemptRef.current = 0;
        const full = await getDockerInventoryByIdAction(id);
        if (full) {
          notifyInventoryUpdate(full);
        }
        return full;
      }

      setInventory((previous) =>
        previous?.id === id
          ? {
              ...previous,
              status: status.status,
              errorMessage: status.errorMessage,
              summary: status.summary,
            }
          : status,
      );
      return status;
    },
    [notifyInventoryUpdate],
  );

  const startRefresh = useCallback(async () => {
    setRefreshing(true);
    clearMessage();
    pollAttemptRef.current = 0;

    const result = await refreshDockerInventoryAction(serverId);
    if (!result.success) {
      setRefreshing(false);
      showFailure(result, tCommon);
      return;
    }

    setInventory(null);
    setSnapshotId(result.snapshotId);
    notifyOperationStarted(serverId);
    await pollInventory(result.snapshotId);
    setRefreshing(false);
  }, [clearMessage, pollInventory, serverId, showFailure, tCommon]);

  useEffect(() => {
    if (startToken <= 0) {
      return;
    }

    void startRefresh();
  }, [startToken, startRefresh]);

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

    let cancelled = false;
    let timer: number | undefined;

    const schedulePoll = () => {
      timer = window.setTimeout(() => {
        void pollInventory(snapshotId).finally(() => {
          if (!cancelled) {
            pollAttemptRef.current += 1;
            schedulePoll();
          }
        });
      }, pollDelayMs(pollAttemptRef.current));
    };

    schedulePoll();

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [inventory, pollInventory, snapshotId]);

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
    clearMessage();

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
      showFailure(result, tCommon);
      return;
    }

    notifyOperationStarted(serverId);
    setSnapshotId(result.followUpSnapshotId);
    await pollInventory(result.followUpSnapshotId);
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
