"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { InventoryPanelStatus } from "@/components/servers/inventory-panel-status";
import { PortScanTable } from "@/components/servers/port-scan-table";
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
import { notifyOperationStarted } from "@/lib/operations/events";
import { useActiveOperationPoll } from "@/lib/operations/use-active-operation-poll";
import type { PortScanView } from "@/types/port-scan";
import {
  getLatestPortScanForServerAction,
  pollPortScanAction,
  startPortScanAction,
} from "@/server/actions/port-scan";

type PortScanPanelProps = {
  serverId: string;
  initialScan?: PortScanView | null;
  startToken?: number;
  onScanUpdated?: (scan: PortScanView) => void;
};

export function PortScanPanel({
  serverId,
  initialScan = null,
  startToken = 0,
  onScanUpdated,
}: PortScanPanelProps) {
  const t = useTranslations("portScan");
  const tCommon = useTranslations("common");
  const [scan, setScan] = useState<PortScanView | null>(initialScan);
  const [loading, setLoading] = useState(false);
  const { message: error, showFailure, clearMessage } = useActionFailureState();
  const loadedLatestRef = useRef(false);
  const lastStartTokenRef = useRef(0);

  useEffect(() => {
    if (loadedLatestRef.current || initialScan) {
      return;
    }

    loadedLatestRef.current = true;
    void getLatestPortScanForServerAction(serverId).then((latest) => {
      if (latest) {
        setScan(latest);
        if (latest.status === "SUCCESS") {
          onScanUpdated?.(latest);
        }
      }
    });
  }, [initialScan, onScanUpdated, serverId]);

  useEffect(() => {
    if (initialScan == null) {
      return;
    }
    if (loading || scan?.status === "RUNNING" || scan?.status === "PENDING") {
      return;
    }
    setScan(initialScan);
  }, [initialScan, loading, scan?.status]);

  const notifyScanUpdate = useCallback(
    (next: PortScanView) => {
      setScan(next);
      if (next.status === "SUCCESS") {
        onScanUpdated?.(next);
      }
    },
    [onScanUpdated],
  );

  const pollScan = useCallback(
    async (scanId: string) => {
      const result = await pollPortScanAction(scanId, serverId);
      if (!result) {
        return null;
      }

      if (result.status === "SUCCESS" || result.status === "FAILED") {
        notifyScanUpdate(result);
        return result;
      }

      setScan((previous) =>
        previous?.id === scanId
          ? { ...previous, status: result.status, errorMessage: result.errorMessage }
          : result,
      );
      return result;
    },
    [notifyScanUpdate, serverId],
  );

  useActiveOperationPoll({
    serverId,
    targetId: scan?.id,
    active: scan?.status === "RUNNING" || scan?.status === "PENDING",
    operationTypes: ["port.scan"],
    poll: pollScan,
  });

  const startScan = useCallback(async () => {
    setLoading(true);
    clearMessage();

    const result = await startPortScanAction(serverId);
    if (!result.success) {
      setLoading(false);
      showFailure(result, tCommon);
      return;
    }

    notifyOperationStarted(serverId);
    setScan((previous) =>
      previous
        ? { ...previous, id: result.scanId, status: "PENDING" }
        : null,
    );
    await pollScan(result.scanId);
    setLoading(false);
  }, [clearMessage, pollScan, serverId, showFailure, tCommon]);

  useEffect(() => {
    if (startToken <= 0 || startToken === lastStartTokenRef.current) {
      return;
    }

    lastStartTokenRef.current = startToken;
    void startScan();
  }, [startToken, startScan, serverId]);

  useEffect(() => {
    if (scan && scan.status !== "RUNNING" && scan.status !== "PENDING") {
      setLoading(false);
    }
  }, [scan]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        {scan?.status === "SUCCESS" && scan.completedAt ? (
          <InventoryPanelStatus
            date={new Date(scan.completedAt).toLocaleString()}
            itemsLabel={t("portCount", { count: scan.findings.length })}
          />
        ) : null}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">{t("scanning")}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {scan?.errorMessage && scan.status === "FAILED" ? (
        <p className="text-sm text-destructive">{scan.errorMessage}</p>
      ) : null}

      <PortScanTable findings={scan?.findings ?? []} />
    </div>
  );
}
