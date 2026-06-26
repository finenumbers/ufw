"use client";

import { useTranslations } from "next-intl";

import { DockerContainerActions } from "@/components/servers/docker-container-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DockerContainerAction, DockerContainerView } from "@/types/docker-monitor";

type DockerContainersTableProps = {
  containers: DockerContainerView[];
  loadingActionRef: string | null;
  pendingAction: DockerContainerAction | null;
  confirmAction: DockerContainerAction | null;
  confirmContainerRef: string | null;
  onDetails: (container: DockerContainerView) => void;
  onStart: (container: DockerContainerView) => void;
  onStop: (container: DockerContainerView) => void;
  onRestart: (container: DockerContainerView) => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
};

function formatMemory(bytes: string | null): string {
  if (!bytes) return "—";
  const value = BigInt(bytes);
  if (value < 1024n) return `${value} B`;
  if (value < 1024n ** 2n) return `${Number(value) / 1024} KiB`;
  if (value < 1024n ** 3n) return `${(Number(value) / 1024 ** 2).toFixed(1)} MiB`;
  return `${(Number(value) / 1024 ** 3).toFixed(1)} GiB`;
}

function formatPorts(container: DockerContainerView): string {
  if (container.publishedPorts.length === 0) {
    return "—";
  }

  return container.publishedPorts
    .map((port) => `${port.container}/${port.protocol}`)
    .join(", ");
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const lower = status.toLowerCase();
  if (lower.includes("up")) return "default";
  if (lower.includes("exited") || lower.includes("dead")) return "destructive";
  return "secondary";
}

export function DockerContainersTable({
  containers,
  loadingActionRef,
  pendingAction,
  confirmAction,
  confirmContainerRef,
  onDetails,
  onStart,
  onStop,
  onRestart,
  onConfirm,
  onCancelConfirm,
}: DockerContainersTableProps) {
  const t = useTranslations("dockerMonitor");

  if (containers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const groups = new Map<string, DockerContainerView[]>();
  for (const container of containers) {
    const key = container.composeProject ?? t("ungrouped");
    const list = groups.get(key) ?? [];
    list.push(container);
    groups.set(key, list);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([group, rows]) => (
        <div key={group} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("columns.name")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.image")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.status")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.health")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.ports")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.cpu")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.memory")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.compose")}</th>
                  <th className="px-3 py-2 font-medium">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((container) => {
                  const isRunning = container.status.toLowerCase().includes("up");
                  const isLoading = loadingActionRef === container.containerId;
                  return (
                    <tr key={container.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium">{container.name}</div>
                        <div className="text-xs text-muted-foreground">{container.containerId}</div>
                      </td>
                      <td className="px-3 py-2">{container.image}</td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(container.status)}>{container.status}</Badge>
                      </td>
                      <td className="px-3 py-2">{container.health ?? "—"}</td>
                      <td className="px-3 py-2">{formatPorts(container)}</td>
                      <td className="px-3 py-2">
                        {container.cpuPercent != null ? `${container.cpuPercent.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2">{formatMemory(container.memUsageBytes)}</td>
                      <td className="px-3 py-2">
                        {container.composeService ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="ghost" onClick={() => onDetails(container)}>
                            {t("details")}
                          </Button>
                          <DockerContainerActions
                            containerRef={container.containerId}
                            containerName={container.name}
                            isRunning={isRunning}
                            loading={isLoading}
                            pendingAction={isLoading ? pendingAction : null}
                            confirmAction={
                              confirmContainerRef === container.containerId ? confirmAction : null
                            }
                            onStart={() => onStart(container)}
                            onStop={() => onStop(container)}
                            onRestart={() => onRestart(container)}
                            onConfirm={onConfirm}
                            onCancelConfirm={onCancelConfirm}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
