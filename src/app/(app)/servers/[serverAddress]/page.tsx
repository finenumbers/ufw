import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ServerDetailView } from "@/components/servers/server-detail-view";
import { isPortScanEnabled } from "@/lib/port-scan/config";
import { isDockerMonitorEnabled } from "@/lib/docker/config";
import { serverNeedsInitialSync } from "@/lib/servers/needs-sync";
import { getServerPath } from "@/lib/server-path";
import { getSession } from "@/lib/session";
import { getServerByAddressAction } from "@/server/actions/servers";
import { getRulesViewPageAction } from "@/server/actions/rules";
import { getLatestDockerInventory } from "@/server/services/docker-monitor.service";
import { getLatestSuccessfulPortScan } from "@/server/services/port-scan.service";
import {
  detectionFromSnapshot,
  getLatestSnapshot,
  persistSnapshotInterfaceOptions,
} from "@/server/services/snapshot.service";
import { getServerInventoryStatsMap } from "@/server/services/server-stats.service";
import type { UfwDetectionResult } from "@/types/ufw";

const emptyUfwState: UfwDetectionResult = {
  installed: false,
  active: false,
  status: { installed: false, active: false, rawStatus: "" },
  rules: [],
  interfaces: [],
};

type PageProps = {
  params: Promise<{ serverAddress: string }>;
};

export default async function ServerDetailPage({ params }: PageProps) {
  const t = await getTranslations("servers");
  const { serverAddress } = await params;
  const server = await getServerByAddressAction(serverAddress);

  if (!server) {
    notFound();
  }

  const session = await getSession();
  const userId = session?.user?.id;

  const latestSnapshot = await getLatestSnapshot(server.id);
  const ufwState = latestSnapshot ? detectionFromSnapshot(latestSnapshot) : emptyUfwState;

  const needsSync = serverNeedsInitialSync(Boolean(userId), Boolean(latestSnapshot));

  if (
    ufwState.installed &&
    ufwState.active &&
    latestSnapshot &&
    ufwState.interfaces.length > 0 &&
    !needsSync
  ) {
    await persistSnapshotInterfaceOptions(server.id, ufwState.interfaces, latestSnapshot);
  }

  const portScanEnabled = isPortScanEnabled();
  const dockerMonitorEnabled = isDockerMonitorEnabled();

  const [rulesPage, inventoryStats, initialPortScan, initialDockerInventory] = await Promise.all([
    userId
      ? getRulesViewPageAction(server.id, 0)
      : Promise.resolve({ rows: [], total: 0, hasMore: false, nextOffset: 0 }),
    getServerInventoryStatsMap([server.id]),
    portScanEnabled ? getLatestSuccessfulPortScan(server.id) : Promise.resolve(null),
    dockerMonitorEnabled ? getLatestDockerInventory(server.id) : Promise.resolve(null),
  ]);

  const stats = inventoryStats.get(server.id);
  const rulesAvailable = ufwState.installed && ufwState.active;
  const portFindingCount = stats?.portFindingCount ?? 0;
  const containerCount = stats?.containerCount ?? 0;

  return (
    <ServerDetailView
      server={{
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        username: server.identity.username,
      }}
      editHref={getServerPath(server.host, "/edit")}
      ufwState={ufwState}
      needsSync={needsSync}
      sshHostKeyVerified={server.sshHostKeyVerified}
      portFindingCount={portFindingCount}
      containerCount={containerCount}
      initialPortScan={initialPortScan}
      initialDockerInventory={initialDockerInventory}
      initialRows={rulesPage.rows}
      initialTotal={rulesPage.total}
      initialHasMore={rulesPage.hasMore}
      initialNextOffset={rulesPage.nextOffset}
      rulesAvailable={rulesAvailable}
      rulesUnavailableMessage={t("rulesUnavailable")}
      portScanEnabled={portScanEnabled}
      dockerMonitorEnabled={dockerMonitorEnabled}
    />
  );
}
