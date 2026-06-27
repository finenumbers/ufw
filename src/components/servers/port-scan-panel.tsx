"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PortScanTable } from "@/components/servers/port-scan-table";
import { resolveActionFailureMessage } from "@/lib/i18n/action-errors";
import { notifyOperationStarted } from "@/lib/operations/events";
import type { PortScanView } from "@/types/port-scan";
import {
  getPortScanByIdAction,
  startPortScanAction,
} from "@/server/actions/port-scan";

type PortScanPanelProps = {
  serverId: string;
  autoStart?: boolean;
};

export function PortScanPanel({ serverId, autoStart = false }: PortScanPanelProps) {
  const t = useTranslations("portScan");
  const tCommon = useTranslations("common");
  const [scan, setScan] = useState<PortScanView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const refreshById = useCallback(async (scanId: string) => {
    const latest = await getPortScanByIdAction(scanId);
    if (latest) {
      setScan(latest);
    }
    return latest;
  }, []);

  const startScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setScan(null);

    const result = await startPortScanAction(serverId);
    setLoading(false);

    if (!result.success) {
      setError(resolveActionFailureMessage(result, tCommon));
      return;
    }

    notifyOperationStarted(serverId);
    await refreshById(result.scanId);
  }, [refreshById, serverId, tCommon]);

  useEffect(() => {
    if (!autoStart || startedRef.current) {
      return;
    }

    startedRef.current = true;
    void startScan();
  }, [autoStart, startScan]);

  useEffect(() => {
    if (!scan?.id || (scan.status !== "RUNNING" && scan.status !== "PENDING")) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshById(scan.id);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [refreshById, scan?.id, scan?.status]);

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
