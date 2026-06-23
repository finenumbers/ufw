import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { OperationBanner } from "@/components/layout/operation-banner";
import { ServerRulesPanel } from "@/components/rules/server-rules-panel";
import { ServerInitialSync } from "@/components/servers/server-initial-sync";
import { UfwDashboard } from "@/components/servers/ufw-dashboard";
import { Button } from "@/components/ui/button";
import { getServerPath } from "@/lib/server-path";
import { getServerByAddressAction } from "@/server/actions/servers";
import { getRulesViewAction } from "@/server/actions/rules";
import { detectUfwState } from "@/server/services/ssh.service";
import { getLatestSnapshot, persistSnapshotInterfaceOptions } from "@/server/services/snapshot.service";
import { remoteSnapshotOutOfSync } from "@/server/services/rules-view.service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

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

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const ufwState = await detectUfwState(server.id);
  const latestSnapshot =
    ufwState.installed && ufwState.active ? await getLatestSnapshot(server.id) : null;

  const needsSync =
    Boolean(userId) &&
    ufwState.installed &&
    ufwState.active &&
    remoteSnapshotOutOfSync(latestSnapshot, ufwState.rules);

  if (
    ufwState.installed &&
    ufwState.active &&
    latestSnapshot &&
    ufwState.interfaces.length > 0 &&
    !needsSync
  ) {
    await persistSnapshotInterfaceOptions(server.id, ufwState.interfaces);
  }

  const rules = userId ? await getRulesViewAction(server.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{server.name}</h2>
          <p className="text-sm text-muted-foreground">
            {server.username}@{server.host}:{server.port}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={getServerPath(server.host, "/edit")}>{t("editServer")}</Link>
        </Button>
      </div>

      <OperationBanner serverId={server.id} />
      {needsSync && <ServerInitialSync serverId={server.id} needsSync={needsSync} />}
      <UfwDashboard serverId={server.id} initialState={ufwState} />

      {ufwState.installed && ufwState.active ? (
        <ServerRulesPanel serverId={server.id} initialRows={rules} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("rulesUnavailable")}</p>
      )}
    </div>
  );
}
