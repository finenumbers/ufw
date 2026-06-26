"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DockerInspectView } from "@/types/docker-monitor";

type DockerContainerDrawerProps = {
  open: boolean;
  inspect: DockerInspectView | null;
  loading: boolean;
  onClose: () => void;
};

function formatPorts(inspect: DockerInspectView): string {
  if (inspect.publishedPorts.length === 0) {
    return "—";
  }

  return inspect.publishedPorts
    .map((port) => {
      const host = port.host ? `${port.host}:` : "";
      return `${host}${port.container}/${port.protocol}`;
    })
    .join(", ");
}

export function DockerContainerDrawer({
  open,
  inspect,
  loading,
  onClose,
}: DockerContainerDrawerProps) {
  const t = useTranslations("dockerMonitor");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-xl flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h4 className="font-semibold">{inspect?.name ?? t("drawerTitle")}</h4>
            <p className="text-xs text-muted-foreground">{inspect?.containerId}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-sm">
          {loading ? <p className="text-muted-foreground">{t("loadingDetails")}</p> : null}
          {!loading && !inspect ? (
            <p className="text-destructive">{t("detailsFailed")}</p>
          ) : null}
          {inspect ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("drawer.image")}</p>
                  <p>{inspect.image}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("drawer.status")}</p>
                  <p>{inspect.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("drawer.health")}</p>
                  <p>{inspect.health ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("drawer.ports")}</p>
                  <p>{formatPorts(inspect)}</p>
                </div>
              </div>

              {inspect.command ? (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{t("drawer.command")}</p>
                  <pre className="overflow-x-auto rounded-md bg-muted/40 p-2 text-xs">{inspect.command}</pre>
                </div>
              ) : null}

              {inspect.mounts.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t("drawer.mounts")}</p>
                  <ul className="space-y-1 text-xs">
                    {inspect.mounts.map((mount) => (
                      <li key={`${mount.source}-${mount.destination}`} className="rounded bg-muted/30 p-2">
                        {mount.source} → {mount.destination}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {inspect.networks.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{t("drawer.networks")}</p>
                  <div className="flex flex-wrap gap-1">
                    {inspect.networks.map((network) => (
                      <Badge key={network} variant="secondary">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {Object.keys(inspect.labels).length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t("drawer.labels")}</p>
                  <ul className="space-y-1 text-xs">
                    {Object.entries(inspect.labels).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key}</span>: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {inspect.env.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t("drawer.env")}</p>
                  <ul className="space-y-1 text-xs">
                    {inspect.env.map((entry) => (
                      <li key={entry.key} className="rounded bg-muted/30 p-2">
                        <span className="font-medium">{entry.key}</span>=
                        {entry.masked ? entry.value : entry.value || " "}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
