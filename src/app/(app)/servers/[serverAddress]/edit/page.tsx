import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerDeleteDialog } from "@/components/servers/server-delete-dialog";
import { ServerForm } from "@/components/servers/server-form";
import { getServerByAddressAction } from "@/server/actions/servers";
import { listIdentitiesAction } from "@/server/actions/identities";

type PageProps = {
  params: Promise<{ serverAddress: string }>;
};

export default async function EditServerPage({ params }: PageProps) {
  const t = await getTranslations("servers.edit");
  const tDelete = await getTranslations("servers.delete");
  const { serverAddress } = await params;
  const server = await getServerByAddressAction(serverAddress);
  const identities = await listIdentitiesAction();

  if (!server) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{server.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("detailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {server.sshHostKeyFingerprint ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium text-muted-foreground">{t("hostKeyFingerprint")}</p>
              <p className="mt-1 font-mono text-xs break-all">{server.sshHostKeyFingerprint}</p>
              {!server.sshHostKeyVerified ? (
                <p className="mt-2 text-amber-700 dark:text-amber-400">{t("hostKeyUnverified")}</p>
              ) : null}
            </div>
          ) : null}
          <ServerForm
            mode="edit"
            serverId={server.id}
            identities={identities}
            defaultValues={{
              name: server.name,
              host: server.host,
              port: server.port,
              identityId: server.identityId,
            }}
          />
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{tDelete("dangerTitle")}</CardTitle>
          <CardDescription>{tDelete("dangerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ServerDeleteDialog serverId={server.id} serverName={server.name} />
        </CardContent>
      </Card>
    </div>
  );
}
