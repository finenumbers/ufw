import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerPath } from "@/lib/server-path";
import { getServersAction } from "@/server/actions/servers";

export default async function ServersPage() {
  const t = await getTranslations("servers");
  const tc = await getTranslations("common");
  const servers = await getServersAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/servers/new">{t("addServer")}</Link>
        </Button>
      </div>

      {servers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <CardTitle>{server.name}</CardTitle>
                <CardDescription>
                  {server.username}@{server.host}:{server.port}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={getServerPath(server.host)}>{tc("open")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={getServerPath(server.host, "/edit")}>{t("editServer")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
