"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PortScanTable } from "@/components/servers/port-scan-table";
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
import { notifyOperationStarted } from "@/lib/operations/events";
import type { PortScanView } from "@/types/port-scan";
import {
  getPortScanByIdAction,
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

  useEffect(() => {
    setScan(initialScan);
  }, [initialScan]);

  const notifyScanUpdate = useCallback(
    (next: PortScanView) => {
      setScan(next);
      if (next.status === "SUCCESS") {
        onScanUpdated?.(next);
      }
    },
    [onScanUpdated],
  );

  const refreshById = useCallback(
    async (scanId: string) => {
      const latest = await getPortScanByIdAction(scanId);
      if (latest) {
        notifyScanUpdate(latest);
      }
      return latest;
    },
    [notifyScanUpdate],
  );

  const startScan = useCallback(async () => {
    setLoading(true);
    clearMessage();

    const result = await startPortScanAction(serverId);
    if (!result.success) {
      setLoading(false);
      showFailure(result, tCommon);
      return;
    }

    setScan(null);
    notifyOperationStarted(serverId);
    await refreshById(result.scanId);
    setLoading(false);
  }, [clearMessage, refreshById, serverId, showFailure, tCommon]);

  useEffect(() => {
    if (startToken <= 0) {
      return;
    }

    void startScan();
  }, [startToken, startScan]);

  useEffect(() => {
    if (!scan?.id || (scan.status !== "RUNNING" && scan.status !== "PENDING")) {
      if (scan && scan.status !== "RUNNING" && scan.status !== "PENDING") {
        setLoading(false);
      }
      return;
    }

    const timer = window.setInterval(() => {
      void refreshById(scan.id);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [refreshById, scan]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">{t("scanning")}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {scan?.completedAt ? (
        <p className="text-xs text-muted-foreground">
          {t("lastScanAt", {
            date: new Date(scan.completedAt).toLocaleString(),
            target: scan.targetHost,
          })}
        </p>
      ) : null}

      {scan?.errorMessage && scan.status === "FAILED" ? (
        <p className="text-sm text-destructive">{scan.errorMessage}</p>
      ) : null}

      <PortScanTable findings={scan?.findings ?? []} summary={scan?.summary ?? null} />
    </div>
  );
}
