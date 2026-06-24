"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { resolveOperationText } from "@/lib/i18n/operations";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { TABLE_PAGE_SIZE } from "@/lib/pagination/table-page-size";
import {
  getAuditEventsPageAction,
  getOperationLogsPageAction,
} from "@/server/actions/operations";
import { operationTypeToKey, parseOperationMetadata } from "@/types/operation";

type OperationLogItem = {
  id: string;
  createdAt: string | Date;
  type: string;
  status: string;
  message: string | null;
  metadata: unknown;
};

type AuditEventItem = {
  id: string;
  createdAt: string | Date;
  action: string;
  entityType: string | null;
  entityId: string | null;
  user: { name: string | null; email: string | null } | null;
};

type OperationsHistoryProps = {
  initialLogs: OperationLogItem[];
  initialLogsTotal: number;
  initialAudits: AuditEventItem[];
  initialAuditsTotal: number;
};

function formatTime(value: string | Date) {
  return new Date(value).toLocaleString();
}

function InfiniteScrollSentinel({
  colSpan,
  hasMore,
  loading,
  onLoadMore,
  loadingLabel,
  scrollLabel,
}: {
  colSpan: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  loadingLabel: string;
  scrollLabel: string;
}) {
  const sentinelRef = useInfiniteScroll(onLoadMore, hasMore, loading);

  if (!hasMore) {
    return null;
  }

  return (
    <tr ref={sentinelRef}>
      <td colSpan={colSpan} className="px-3 py-3 text-center text-muted-foreground">
        {loading ? loadingLabel : scrollLabel}
      </td>
    </tr>
  );
}

export function OperationsHistory({
  initialLogs,
  initialLogsTotal,
  initialAudits,
  initialAuditsTotal,
}: OperationsHistoryProps) {
  const t = useTranslations("operationsPage");
  const to = useTranslations("operations");
  const tc = useTranslations("common");

  const translateOperation = (key: string, values?: Record<string, string | number>) =>
    to(key as never, values as never);

  const [logs, setLogs] = useState(initialLogs);
  const [logsLoading, setLogsLoading] = useState(false);
  const logsHasMore = logs.length < initialLogsTotal;

  const [audits, setAudits] = useState(initialAudits);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const auditsHasMore = audits.length < initialAuditsTotal;

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs, initialLogsTotal]);

  useEffect(() => {
    setAudits(initialAudits);
  }, [initialAudits, initialAuditsTotal]);

  const loadMoreLogs = useCallback(async () => {
    if (logsLoading || !logsHasMore) {
      return;
    }

    setLogsLoading(true);
    try {
      const nextPage = Math.floor(logs.length / TABLE_PAGE_SIZE) + 1;
      const result = await getOperationLogsPageAction(nextPage);
      setLogs((previous) => [...previous, ...result.items]);
    } finally {
      setLogsLoading(false);
    }
  }, [logs.length, logsHasMore, logsLoading]);

  const loadMoreAudits = useCallback(async () => {
    if (auditsLoading || !auditsHasMore) {
      return;
    }

    setAuditsLoading(true);
    try {
      const nextPage = Math.floor(audits.length / TABLE_PAGE_SIZE) + 1;
      const result = await getAuditEventsPageAction(nextPage);
      setAudits((previous) => [...previous, ...result.items]);
    } finally {
      setAuditsLoading(false);
    }
  }, [audits.length, auditsHasMore, auditsLoading]);

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-lg font-medium">{t("logsTitle")}</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-center align-middle">{t("time")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("type")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("status")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("message")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{formatTime(item.createdAt)}</td>
                  <td className="px-3 py-2">
                    {to(`types.${operationTypeToKey(item.type)}` as never)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        item.status === "SUCCESS"
                          ? "matched"
                          : item.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {to(`status.${item.status}` as never)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {resolveOperationText(
                      translateOperation,
                      parseOperationMetadata(item.metadata)?.messageI18n ??
                        (item.message ? { key: item.message } : undefined),
                      item.message,
                    ) ?? tc("dash")}
                  </td>
                </tr>
              ))}
              <InfiniteScrollSentinel
                colSpan={4}
                hasMore={logsHasMore}
                loading={logsLoading}
                onLoadMore={loadMoreLogs}
                loadingLabel={t("loadingMore")}
                scrollLabel={t("scrollForMore")}
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">{t("auditTitle")}</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-center align-middle">{t("time")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("action")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("user")}</th>
                <th className="px-3 py-2 text-center align-middle">{t("entity")}</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{formatTime(item.createdAt)}</td>
                  <td className="px-3 py-2">{item.action}</td>
                  <td className="px-3 py-2">{item.user?.email ?? tc("dash")}</td>
                  <td className="px-3 py-2">
                    {item.entityType ?? tc("dash")} {item.entityId ? `(${item.entityId})` : ""}
                  </td>
                </tr>
              ))}
              <InfiniteScrollSentinel
                colSpan={4}
                hasMore={auditsHasMore}
                loading={auditsLoading}
                onLoadMore={loadMoreAudits}
                loadingLabel={t("loadingMore")}
                scrollLabel={t("scrollForMore")}
              />
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
