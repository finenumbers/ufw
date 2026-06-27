"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { OperationBanner } from "@/components/layout/operation-banner";
import { RulesImportExport } from "@/components/rules/rules-import-export";
import { RulesToolbar } from "@/components/rules/rules-toolbar";
import { ServerInitialSync } from "@/components/servers/server-initial-sync";
import { UfwDashboard } from "@/components/servers/ufw-dashboard";
import { Button } from "@/components/ui/button";
import { OPERATION_ENDED_EVENT, OPERATION_STARTED_EVENT } from "@/lib/operations/events";
import type { DockerInventoryView } from "@/types/docker-monitor";
import type { PortScanView } from "@/types/port-scan";
import type { UnifiedRuleRow } from "@/types/rule";
import type { UfwDetectionResult } from "@/types/ufw";
import { getRulesViewPageAction } from "@/server/actions/rules";

const RulesGroupSection = dynamic(
  () =>
    import("@/components/rules/rules-group-section").then((module) => ({
      default: module.RulesGroupSection,
    })),
  { ssr: false },
);

const PortScanPanel = dynamic(
  () =>
    import("@/components/servers/port-scan-panel").then((module) => ({
      default: module.PortScanPanel,
    })),
  { ssr: false },
);

const DockerMonitorPanel = dynamic(
  () =>
    import("@/components/servers/docker-monitor-panel").then((module) => ({
      default: module.DockerMonitorPanel,
    })),
  { ssr: false },
);

type ServerDetailViewProps = {
  server: {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
  };
  editHref: string;
  ufwState: UfwDetectionResult;
  needsSync: boolean;
  dbRulesCount: number;
  portFindingCount: number;
  containerCount: number;
  initialPortScan: PortScanView | null;
  initialDockerInventory: DockerInventoryView | null;
  initialRows: UnifiedRuleRow[];
  initialTotal: number;
  initialHasMore: boolean;
  initialNextOffset: number;
  rulesAvailable: boolean;
  rulesUnavailableMessage: string;
  portScanEnabled: boolean;
  dockerMonitorEnabled: boolean;
};

function sortRows(rows: UnifiedRuleRow[]): UnifiedRuleRow[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function ServerDetailView({
  server,
  editHref,
  ufwState,
  needsSync,
  dbRulesCount,
  portFindingCount: initialPortFindingCount,
  containerCount: initialContainerCount,
  initialPortScan,
  initialDockerInventory,
  initialRows,
  initialTotal,
  initialHasMore,
  initialNextOffset,
  rulesAvailable,
  rulesUnavailableMessage,
  portScanEnabled,
  dockerMonitorEnabled,
}: ServerDetailViewProps) {
  const tServers = useTranslations("servers");
  const [portScanStartToken, setPortScanStartToken] = useState(0);
  const [dockerStartToken, setDockerStartToken] = useState(0);
  const [portFindingCount, setPortFindingCount] = useState(initialPortFindingCount);
  const [containerCount, setContainerCount] = useState(initialContainerCount);
  const [rows, setRows] = useState(() => sortRows(initialRows));
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [loadingMore, setLoadingMore] = useState(false);
  const [optionsRefreshKey, setOptionsRefreshKey] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const loadingMoreRef = useRef(false);
  const rowsRef = useRef(rows);
  const rowsDirtyRef = useRef(false);
  const operationActiveRef = useRef(false);
  rowsRef.current = rows;

  useEffect(() => {
    function handleOperationStarted() {
      operationActiveRef.current = true;
    }

    function handleOperationEnded() {
      operationActiveRef.current = false;
    }

    window.addEventListener(OPERATION_STARTED_EVENT, handleOperationStarted);
    window.addEventListener(OPERATION_ENDED_EVENT, handleOperationEnded);
    return () => {
      window.removeEventListener(OPERATION_STARTED_EVENT, handleOperationStarted);
      window.removeEventListener(OPERATION_ENDED_EVENT, handleOperationEnded);
    };
  }, []);

  useEffect(() => {
    if (operationActiveRef.current) {
      return;
    }
    setPortFindingCount(initialPortFindingCount);
    setContainerCount(initialContainerCount);
  }, [initialPortFindingCount, initialContainerCount]);

  useEffect(() => {
    if (rowsDirtyRef.current || operationActiveRef.current || loadingMoreRef.current) {
      return;
    }
    setRows(sortRows(initialRows));
    setTotal(initialTotal);
    setHasMore(initialHasMore);
    setNextOffset(initialNextOffset);
  }, [initialRows, initialTotal, initialHasMore, initialNextOffset]);

  const handleRowsChange = useCallback((next: UnifiedRuleRow[]) => {
    rowsDirtyRef.current = true;
    setRows(next);
  }, []);

  const refreshRules = useCallback(async () => {
    const page = await getRulesViewPageAction(server.id, 0);
    rowsDirtyRef.current = false;
    setRows(sortRows(page.rows));
    setTotal(page.total);
    setHasMore(page.hasMore);
    setNextOffset(page.nextOffset);
    setOptionsRefreshKey((value) => value + 1);
    setImportError(null);
    setImportNotice(null);
  }, [server.id]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await getRulesViewPageAction(server.id, nextOffset);
      setRows((previous) => sortRows([...previous, ...page.rows]));
      setTotal(page.total);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [server.id, nextOffset, hasMore]);

  const resolveAllRows = useCallback(async (): Promise<UnifiedRuleRow[]> => {
    if (!hasMore) {
      return rowsRef.current;
    }

    const result = [...rowsRef.current];
    const loadedIds = new Set(result.map((row) => row.clientRowId));
    let offset = nextOffset;

    while (true) {
      const page = await getRulesViewPageAction(server.id, offset);
      for (const row of page.rows) {
        if (!loadedIds.has(row.clientRowId)) {
          result.push(row);
          loadedIds.add(row.clientRowId);
        }
      }
      if (!page.hasMore) {
        break;
      }
      offset = page.nextOffset;
    }

    return sortRows(result);
  }, [server.id, nextOffset, hasMore]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{server.name}</h2>
            <p className="text-sm text-muted-foreground">
              {server.username}@{server.host}:{server.port}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {rulesAvailable ? (
              <RulesImportExport
                serverId={server.id}
                rows={rows}
                resolveAllRows={resolveAllRows}
                onImportSuccess={refreshRules}
                onStatusChange={({ error, notice }) => {
                  setImportError(error);
                  setImportNotice(notice);
                }}
              />
            ) : null}
            <Button asChild variant="outline" size="icon" aria-label={tServers("editServer")}>
              <Link href={editHref}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {importError ? <p className="text-sm text-destructive">{importError}</p> : null}
        {importNotice ? <p className="text-sm text-muted-foreground">{importNotice}</p> : null}
      </div>

      <OperationBanner serverId={server.id} />
      {needsSync ? <ServerInitialSync serverId={server.id} needsSync={needsSync} /> : null}
      <UfwDashboard
        serverId={server.id}
        initialState={ufwState}
        dbRulesCount={dbRulesCount}
        portFindingCount={portFindingCount}
        containerCount={containerCount}
        rows={rows}
        onRowsChange={handleRowsChange}
        resolveAllRows={resolveAllRows}
        onRulesRefresh={refreshRules}
        portScanEnabled={portScanEnabled}
        dockerMonitorEnabled={dockerMonitorEnabled}
        onPortScanClick={() => setPortScanStartToken((value) => value + 1)}
        onDockerRefreshClick={() => setDockerStartToken((value) => value + 1)}
      />

      {rulesAvailable ? (
        <div className="space-y-4">
          <RulesToolbar />
          <RulesGroupSection
            serverId={server.id}
            rows={rows}
            onChange={handleRowsChange}
            optionsRefreshKey={optionsRefreshKey}
            total={total}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{rulesUnavailableMessage}</p>
      )}

      {portScanEnabled ? (
        <PortScanPanel
          serverId={server.id}
          initialScan={initialPortScan}
          startToken={portScanStartToken}
          onScanUpdated={(scan) => setPortFindingCount(scan.findings.length)}
        />
      ) : null}

      {dockerMonitorEnabled ? (
        <DockerMonitorPanel
          serverId={server.id}
          initialInventory={initialDockerInventory}
          startToken={dockerStartToken}
          onInventoryUpdated={(inventory) =>
            setContainerCount(inventory.summary?.containerCount ?? 0)
          }
        />
      ) : null}
    </div>
  );
}
