"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PortScanTable } from "@/components/servers/port-scan-table";
import { useActionFailureState } from "@/lib/i18n/use-action-failure-state";
import { notifyOperationStarted } from "@/lib/operations/events";
import type { PortScanView } from "@/types/port-scan";
import {
  getLatestPortScanForServerAction,
  getPortScanByIdAction,
  getPortScanStatusByIdAction,
  startPortScanAction,
} from "@/server/actions/port-scan";

type PortScanPanelProps = {
  serverId: string;
  initialScan?: PortScanView | null;
  startToken?: number;
  onScanUpdated?: (scan: PortScanView) => void;
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
  const pollAttemptRef = useRef(0);
  const loadedLatestRef = useRef(false);

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
      const status = await getPortScanStatusByIdAction(scanId);
      if (!status) {
        return null;
      }

      if (status.status === "SUCCESS" || status.status === "FAILED") {
        pollAttemptRef.current = 0;
        const full = await getPortScanByIdAction(scanId);
        if (full) {
          notifyScanUpdate(full);
        }
        return full;
      }

      setScan((previous) =>
        previous?.id === scanId
          ? { ...previous, status: status.status, errorMessage: status.errorMessage }
          : status,
      );
      return status;
    },
    [notifyScanUpdate],
  );

  const startScan = useCallback(async () => {
    setLoading(true);
    clearMessage();
    pollAttemptRef.current = 0;

    const result = await startPortScanAction(serverId);
    if (!result.success) {
      setLoading(false);
      showFailure(result, tCommon);
      return;
    }

    setScan(null);
    notifyOperationStarted(serverId);
    await pollScan(result.scanId);
    setLoading(false);
  }, [clearMessage, pollScan, serverId, showFailure, tCommon]);

  useEffect(() => {
    if (startToken <= 0) {
      return;
    }

    void startScan();
  }, [startToken, startScan]);

  useEffect(() => {
    const scanId = scan?.id;
    if (!scanId || (scan.status !== "RUNNING" && scan.status !== "PENDING")) {
      if (scan && scan.status !== "RUNNING" && scan.status !== "PENDING") {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const schedulePoll = () => {
      timer = window.setTimeout(() => {
        void pollScan(scanId).finally(() => {
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
  }, [pollScan, scan]);

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
