import { getTranslations } from "next-intl/server";

import { ServersConfigToolbar } from "@/components/servers/servers-config-toolbar";
import { ServersGrid } from "@/components/servers/servers-grid";
import { getServersAction } from "@/server/actions/servers";

export default async function ServersPage() {
  const t = await getTranslations("servers");
  const servers = await getServersAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ServersConfigToolbar />
      </div>

      <ServersGrid
        servers={servers.map((server) => ({
          id: server.id,
          name: server.name,
          host: server.host,
          port: server.port,
          username: server.identity.username,
          savedRuleCount: server.savedRuleCount,
          portFindingCount: server.portFindingCount,
        }))}
      />
    </div>
  );
}
